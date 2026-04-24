import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "../shared/models/auth";
import {
  setupAuth,
  isAuthenticated,
  registerAuthRoutes,
} from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, CATEGORY_ALLOWED_FIELDS } from "@shared/constants";
import { calculateFees } from "@shared/feeCalculator";
import type { Item } from "@shared/schema";

function resolveItemPrice(i: Pick<Item, "approvedPrice" | "salePrice" | "maxPrice" | "minPrice">): number {
  return parseFloat(i.approvedPrice || i.salePrice || i.maxPrice || i.minPrice || "0");
}

function buildAgreementSnapshot(items: Item[]): { itemsSnapshot: string; feeBreakdown: string; totalValue: string } {
  const snapItems = items.map((i) => {
    const price = resolveItemPrice(i);
    const fees = calculateFees(price);
    return { id: i.id, title: i.title, approvedPrice: price, fees };
  });
  const totalValue = snapItems.reduce((sum, it) => sum + it.approvedPrice, 0);
  return {
    itemsSnapshot: JSON.stringify(snapItems),
    feeBreakdown: JSON.stringify(snapItems.map((it) => ({ itemId: it.id, title: it.title, salePrice: it.approvedPrice, fees: it.fees }))),
    totalValue: totalValue.toFixed(2),
  };
}

const wsClients = new Map<string, Set<WebSocket>>();

function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Validation error", errors: result.error.errors });
    }
    req.body = result.data;
    next();
  };
}

const createProfileBody = z.object({
  role: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  siretNumber: z.string().optional(),
  preferredContactMethod: z.string().optional(),
});

const itemFields = {
  description: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  photos: z.array(z.string()).optional(),
  certificatePhotos: z.array(z.string()).optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  vintage: z.string().optional(),
  ageRange: z.string().optional(),
  model: z.string().optional(),
  deviceStorage: z.string().optional(),
  ram: z.string().optional(),
  volume: z.string().optional(),
  frameSize: z.string().optional(),
  instrumentType: z.string().optional(),
  applianceType: z.string().optional(),
  decorStyle: z.string().optional(),
  subcategory: z.string().optional(),
};

const CATEGORY_CONSTRAINED_FIELDS = [
  "brand", "size", "condition", "subcategory",
  "material", "dimensions", "author", "genre", "language",
  "vintage", "ageRange", "model", "deviceStorage", "ram", "volume",
  "frameSize", "instrumentType", "applianceType", "decorStyle",
  "certificatePhotos",
] as const;

function validateCategoryFields(data: { category: string; [key: string]: unknown }, ctx: z.RefinementCtx) {
  const allowed = CATEGORY_ALLOWED_FIELDS[data.category as typeof ITEM_CATEGORIES[number]];
  if (!allowed) return;
  for (const field of CATEGORY_CONSTRAINED_FIELDS) {
    const value = data[field];
    const hasValue = Array.isArray(value) ? value.length > 0 : (value !== undefined && value !== null && value !== "");
    if (hasValue && !allowed.includes(field)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field '${field}' is not allowed for category '${data.category}'`,
        path: [field],
      });
    }
  }
}

const createItemBody = z.object({
  title: z.string().min(1),
  category: z.enum(ITEM_CATEGORIES),
  ...itemFields,
}).superRefine(validateCategoryFields);

const updateItemBody = z.object({
  title: z.string().min(1).optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  ...itemFields,
}).superRefine((data, ctx) => {
  if (data.category) validateCategoryFields(data as { category: string; [key: string]: unknown }, ctx);
});

const createMeetingBody = z.object({
  scheduledDate: z.string(),
  location: z.string(),
  notes: z.string().optional(),
  duration: z.number().optional(),
});

const createMessageBody = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
  requestId: z.number().optional(),
});

export function broadcastToUser(userId: string, data: unknown) {
  const clients = wsClients.get(userId);
  if (!clients) return;
  const payload = JSON.stringify(data);
  Array.from(clients).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
function requireAuth(req: any, res: Response, next: NextFunction) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profile = await storage.getProfile(req.user.claims.sub);
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws, req) => {
    let userId: string | null = null;
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "auth" && typeof msg.userId === "string") {
          userId = msg.userId;
          const uid = userId as string;
          if (!wsClients.has(uid)) wsClients.set(uid, new Set());
          wsClients.get(uid)!.add(ws);
        }
      } catch {}
    });
    ws.on("close", () => {
      if (userId) wsClients.get(userId as string)?.delete(ws);
    });
  });

  app.get(
    "/api/profile",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
        res.json(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
      }
    },
  );

  app.post(
    "/api/profile",
    isAuthenticated,
    requireAuth,
    validate(createProfileBody),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const existing = await storage.getProfile(userId);
        if (existing) {
          return res.status(400).json({ message: "Profile already exists" });
        }
        const {
          role,
          phone,
          address,
          city,
          postalCode,
          department,
          bio,
          experience,
          siretNumber,
          preferredContactMethod,
        } = req.body;
        const profile = await storage.createProfile({
          userId,
          role,
          phone: phone || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          department: department || null,
          bio: bio || null,
          experience: experience || null,
          siretNumber: siretNumber || null,
          status: role === "reusse" ? "pending" : "approved",
          preferredContactMethod: preferredContactMethod || "email",
        });
        res.json(profile);
      } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ message: "Failed to create profile" });
      }
    },
  );

  app.patch(
    "/api/profile",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.updateProfile(userId, req.body);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
        res.json(profile);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  app.get(
    "/api/requests",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res.status(400).json({ message: "Profile required" });
        }
        const result = await storage.getRequests(userId, profile.role);
        res.json(result);
      } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
      }
    },
  );

  app.get(
    "/api/requests/available",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const result = await storage.getAvailableRequests();
        res.json(result);
      } catch (error) {
        console.error("Error fetching available requests:", error);
        res.status(500).json({ message: "Failed to fetch available requests" });
      }
    },
  );

  app.get(
    "/api/requests/:id",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        res.json(request);
      } catch (error) {
        console.error("Error fetching request:", error);
        res.status(500).json({ message: "Failed to fetch request" });
      }
    },
  );

  app.get(
    "/api/requests/:id/contact",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });
        if (userId !== request.sellerId && userId !== request.reusseId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const otherUserId =
          userId === request.sellerId ? request.reusseId : request.sellerId;
        if (!otherUserId) return res.json(null);
        const profile = await storage.getProfile(otherUserId);
        const [userRow] = await db
          .select()
          .from(users)
          .where(eq(users.id, otherUserId));
        res.json({
          firstName: userRow?.firstName,
          lastName: userRow?.lastName,
          phone: profile?.phone,
          address: profile?.address,
          city: profile?.city,
          role: profile?.role,
        });
      } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({ message: "Failed to fetch contact" });
      }
    },
  );

  app.post(
    "/api/requests",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        // Role check: only sellers can create requests
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "seller") {
          return res
            .status(403)
            .json({ message: "Only sellers can create requests" });
        }

        const {
          serviceType,
          itemCount,
          estimatedValue,
          categories,
          condition,
          brands,
          meetingLocation,
          preferredDateStart,
          preferredDateEnd,
          notes,
        } = req.body;
        const request = await storage.createRequest({
          sellerId: userId,
          serviceType,
          status: "pending",
          itemCount,
          estimatedValue: estimatedValue || null,
          categories: categories || null,
          condition: condition || null,
          brands: brands || null,
          meetingLocation: meetingLocation || null,
          preferredDateStart: preferredDateStart
            ? new Date(preferredDateStart)
            : null,
          preferredDateEnd: preferredDateEnd
            ? new Date(preferredDateEnd)
            : null,
          notes: notes || null,
        });
        res.json(request);
      } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ message: "Failed to create request" });
      }
    },
  );

  app.post(
    "/api/requests/:id/accept",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "reusse") {
          return res
            .status(403)
            .json({ message: "Only resellers can accept requests" });
        }
        if (profile.status !== "approved") {
          return res.status(403).json({ message: "Reseller must be approved" });
        }
        const id = parseInt(req.params.id);
        const request = await storage.acceptRequest(id, userId);
        if (!request) {
          return res.status(400).json({ message: "Request unavailable" });
        }

        await storage.createNotification({
          userId: request.sellerId,
          type: "request_matched",
          title: "Request Matched",
          message: "A reseller has been assigned to your request!",
          link: `/requests/${request.id}`,
        });

        res.json(request);
      } catch (error) {
        console.error("Error accepting request:", error);
        res.status(500).json({ message: "Failed to accept request" });
      }
    },
  );

  app.get(
    "/api/requests/:id/items",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const result = await storage.getItemsByRequest(id);
        res.json(result);
      } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Failed to fetch items" });
      }
    },
  );

  app.post(
    "/api/requests/:id/items",
    isAuthenticated,
    requireAuth,
    validate(createItemBody),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const requestId = parseInt(req.params.id);
        const request = await storage.getRequest(requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        // Role check: only the assigned reusse can add items
        if (request.reusseId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the assigned reseller can add items" });
        }

        // List lock check: cannot add items after finalization
        if (request.listReadyAt) {
          return res.status(400).json({ message: "Item list is finalized and locked — no further changes allowed" });
        }

        const {
          title,
          description,
          brand,
          size,
          category,
          condition,
          minPrice,
          maxPrice,
          photos,
          certificatePhotos,
          material,
          dimensions,
          author,
          genre,
          language,
          vintage,
          ageRange,
          model,
          deviceStorage,
          ram,
          volume,
          frameSize,
          instrumentType,
          applianceType,
          decorStyle,
          subcategory,
        } = req.body;
        const item = await storage.createItem({
          requestId,
          sellerId: request.sellerId,
          reusseId: userId,
          title,
          description: description || null,
          brand: brand || null,
          size: size || null,
          category,
          condition: condition || null,
          status: "pending_approval",
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          photos: photos || null,
          certificatePhotos: certificatePhotos || null,
          material: material || null,
          dimensions: dimensions || null,
          author: author || null,
          genre: genre || null,
          language: language || null,
          vintage: vintage || null,
          ageRange: ageRange || null,
          model: model || null,
          deviceStorage: deviceStorage || null,
          ram: ram || null,
          volume: volume || null,
          frameSize: frameSize || null,
          instrumentType: instrumentType || null,
          applianceType: applianceType || null,
          decorStyle: decorStyle || null,
          subcategory: subcategory || null,
        });

        await storage.createNotification({
          userId: request.sellerId,
          type: "item_added",
          title: "New Item Added",
          message: `Item "${title}" was added to your request.`,
          link: `/requests/${requestId}`,
        });

        res.json(item);
      } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Failed to create item" });
      }
    },
  );

  app.get("/api/items", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: "Profile required" });
      }
      const result = await storage.getItems(userId, profile.role);
      res.json(result);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get(
    "/api/requests/:id/meetings",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const result = await storage.getMeetingsByRequest(id);
        res.json(result);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
      }
    },
  );

  app.post(
    "/api/requests/:id/meetings",
    isAuthenticated,
    requireAuth,
    validate(createMeetingBody),
    async (req: any, res) => {
      try {
        const requestId = parseInt(req.params.id);
        const request = await storage.getRequest(requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        const { scheduledDate, location, notes, duration } = req.body;
        const meeting = await storage.createMeeting({
          requestId,
          scheduledDate: new Date(scheduledDate),
          location,
          status: "scheduled",
          notes: notes || null,
          duration: duration || 60,
        });

        await storage.updateRequest(requestId, { status: "scheduled" });

        const notifyUserId =
          req.user.claims.sub === request.sellerId
            ? request.reusseId
            : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "meeting_scheduled",
            title: "Meeting Scheduled",
            message: `A meeting has been scheduled for ${new Date(scheduledDate).toLocaleDateString("fr-FR")}.`,
            link: `/requests/${requestId}`,
          });
        }

        res.json(meeting);
      } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ message: "Failed to create meeting" });
      }
    },
  );

  app.patch(
    "/api/meetings/:meetingId/cancel",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const meetingId = parseInt(req.params.meetingId);
        const meeting = await storage.getMeeting(meetingId);
        if (!meeting) {
          return res.status(404).json({ message: "Meeting not found" });
        }
        const request = await storage.getRequest(meeting.requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        const userId = req.user.claims.sub;
        if (userId !== request.sellerId && userId !== request.reusseId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const updated = await storage.updateMeeting(meetingId, {
          status: "cancelled",
        });
        const notifyUserId =
          userId === request.sellerId ? request.reusseId : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "meeting_cancelled",
            title: "Meeting Cancelled",
            message: `A meeting scheduled for ${meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString("fr-FR") : "unknown date"} has been cancelled.`,
            link: `/requests/${request.id}`,
          });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error cancelling meeting:", error);
        res.status(500).json({ message: "Failed to cancel meeting" });
      }
    },
  );

  app.patch(
    "/api/meetings/:meetingId/reschedule",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const meetingId = parseInt(req.params.meetingId);
        const meeting = await storage.getMeeting(meetingId);
        if (!meeting) {
          return res.status(404).json({ message: "Meeting not found" });
        }
        const request = await storage.getRequest(meeting.requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        const userId = req.user.claims.sub;
        if (userId !== request.sellerId && userId !== request.reusseId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const { scheduledDate, location, notes } = req.body;
        if (!scheduledDate) {
          return res.status(400).json({ message: "scheduledDate is required" });
        }
        const parsedDate = new Date(scheduledDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        const updated = await storage.updateMeeting(meetingId, {
          scheduledDate: parsedDate,
          location: location || meeting.location,
          notes: notes !== undefined ? notes : meeting.notes,
          status: "scheduled",
        });
        const notifyUserId =
          userId === request.sellerId ? request.reusseId : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "meeting_rescheduled",
            title: "Meeting Rescheduled",
            message: `A meeting has been rescheduled to ${new Date(scheduledDate).toLocaleDateString("fr-FR")}.`,
            link: `/requests/${request.id}`,
          });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error rescheduling meeting:", error);
        res.status(500).json({ message: "Failed to reschedule meeting" });
      }
    },
  );

  app.get(
    "/api/meetings",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const result = await storage.getMeetings(userId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
      }
    },
  );

  app.get(
    "/api/messages/conversations",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const result = await storage.getConversations(userId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Failed to fetch conversations" });
      }
    },
  );

  app.get(
    "/api/messages/:userId",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const currentUserId = req.user.claims.sub;
        const otherUserId = req.params.userId;
        const result = await storage.getMessagesBetween(
          currentUserId,
          otherUserId,
        );
        res.json(result);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.post(
    "/api/messages",
    isAuthenticated,
    requireAuth,
    validate(createMessageBody),
    async (req: any, res) => {
      try {
        const senderId = req.user.claims.sub;
        const { receiverId, content, requestId } = req.body;
        const message = await storage.createMessage({
          senderId,
          receiverId,
          content,
          requestId: requestId || null,
        });
        broadcastToUser(receiverId, { type: "new_message", message });
        broadcastToUser(senderId, { type: "new_message", message });
        res.json(message);
      } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  app.get(
    "/api/notifications",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const result = await storage.getNotifications(userId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
      }
    },
  );

  app.patch(
    "/api/notifications/:id/read",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        await storage.markNotificationRead(id, userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Failed to update notification" });
      }
    },
  );

  app.patch(
    "/api/notifications/read-all",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        await storage.markAllNotificationsRead(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking all notifications read:", error);
        res.status(500).json({ message: "Failed to update notifications" });
      }
    },
  );

  app.get(
    "/api/admin/users",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const result = await storage.getAllUsersWithProfiles();
        res.json(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    },
  );

  app.get(
    "/api/admin/applications",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const result = await storage.getPendingReusses();
        res.json(result);
      } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    },
  );

  app.patch(
    "/api/admin/applications/:userId",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const { status } = req.body;
        const profile = await storage.updateProfileStatus(userId, status);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        await storage.createNotification({
          userId,
          type: "application_update",
          title:
            status === "approved"
              ? "Application Approved"
              : "Application Update",
          message:
            status === "approved"
              ? "Your reseller application has been approved! You can now accept seller requests."
              : "Your reseller application status has been updated.",
        });

        res.json(profile);
      } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Failed to update application" });
      }
    },
  );

  app.get(
    "/api/admin/stats",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    },
  );

  app.get("/api/admin/requests", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getAdminRequests(status);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/admin/requests/:id/flag", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const updated = await storage.updateRequest(id, { status: "flagged" });
      await storage.createNotification({ userId: request.sellerId, type: "moderation_flag", message: `Your request #${id} has been flagged for review.${reason ? ` Reason: ${reason}` : ""}` });
      await storage.logModerationAction({ requestId: id, adminId, action: "flag", reason });
      res.json(updated);
    } catch (error) {
      console.error("Error flagging request:", error);
      res.status(500).json({ message: "Failed to flag request" });
    }
  });

  app.post("/api/admin/requests/:id/message", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { message } = req.body;
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const notification = await storage.createNotification({ userId: request.sellerId, type: "admin_message", message: `Admin message for your request #${id}: ${message}` });
      await storage.logModerationAction({ requestId: id, adminId, action: "message", metadata: message });
      res.json(notification);
    } catch (error) {
      console.error("Error sending admin message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/admin/requests/:id/reject", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const updated = await storage.updateRequest(id, { status: "cancelled" });
      await storage.createNotification({ userId: request.sellerId, type: "moderation_reject", message: `Your request #${id} has been rejected.${reason ? ` Reason: ${reason}` : ""}` });
      if (request.reusseId) {
        await storage.createNotification({ userId: request.reusseId, type: "moderation_reject", message: `Request #${id} you were assigned to has been cancelled by an admin.` });
      }
      await storage.logModerationAction({ requestId: id, adminId, action: "reject", reason });
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ message: "Failed to reject request" });
    }
  });

  app.get("/api/admin/requests/:id/moderation", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const actions = await storage.getModerationActions(id);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching moderation history:", error);
      res.status(500).json({ message: "Failed to fetch moderation history" });
    }
  });

  app.patch(
    "/api/items/:id",
    isAuthenticated,
    requireAuth,
    validate(updateItemBody),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const existingItem = await storage.getItem(id);
        if (!existingItem) return res.status(404).json({ message: "Item not found" });
        if (existingItem.reusseId !== userId) {
          return res.status(403).json({ message: "Only the assigned reseller can edit this item" });
        }
        if (existingItem.requestId) {
          const parentRequest = await storage.getRequest(existingItem.requestId);
          if (parentRequest?.listReadyAt) {
            return res.status(400).json({ message: "Item list is finalized and locked — no further changes allowed" });
          }
        }
        const {
          title, description, brand, size, category, condition,
          minPrice, maxPrice, photos, certificatePhotos,
          material, dimensions, author, genre, language, vintage,
          ageRange, model, deviceStorage, ram, volume, frameSize,
          instrumentType, applianceType, decorStyle, subcategory,
        } = req.body;

        // Apply category-aware validation using existing item's category when not changing it
        const effectiveCategory = category || existingItem.category;
        const categoryIssues: z.ZodIssue[] = [];
        const collectCtx: z.RefinementCtx = { addIssue: (issue) => categoryIssues.push(issue as z.ZodIssue), path: [] };
        validateCategoryFields({ ...req.body, category: effectiveCategory }, collectCtx);
        if (categoryIssues.length > 0) {
          return res.status(400).json({ message: "Validation error", errors: categoryIssues });
        }
        const updated = await storage.updateItem(id, {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description: description || null }),
          ...(brand !== undefined && { brand: brand || null }),
          ...(size !== undefined && { size: size || null }),
          ...(category !== undefined && { category }),
          ...(condition !== undefined && { condition: condition || null }),
          ...(minPrice !== undefined && { minPrice: minPrice || null }),
          ...(maxPrice !== undefined && { maxPrice: maxPrice || null }),
          ...(photos !== undefined && { photos: photos || null }),
          ...(certificatePhotos !== undefined && { certificatePhotos: certificatePhotos || null }),
          ...(material !== undefined && { material: material || null }),
          ...(dimensions !== undefined && { dimensions: dimensions || null }),
          ...(author !== undefined && { author: author || null }),
          ...(genre !== undefined && { genre: genre || null }),
          ...(language !== undefined && { language: language || null }),
          ...(vintage !== undefined && { vintage: vintage || null }),
          ...(ageRange !== undefined && { ageRange: ageRange || null }),
          ...(model !== undefined && { model: model || null }),
          ...(deviceStorage !== undefined && { deviceStorage: deviceStorage || null }),
          ...(ram !== undefined && { ram: ram || null }),
          ...(volume !== undefined && { volume: volume || null }),
          ...(frameSize !== undefined && { frameSize: frameSize || null }),
          ...(instrumentType !== undefined && { instrumentType: instrumentType || null }),
          ...(applianceType !== undefined && { applianceType: applianceType || null }),
          ...(decorStyle !== undefined && { decorStyle: decorStyle || null }),
          ...(subcategory !== undefined && { subcategory: subcategory || null }),
        });
        if (!updated) return res.status(404).json({ message: "Item not found" });
        res.json(updated);
      } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Failed to update item" });
      }
    },
  );

  app.post(
    "/api/items/:id/approve",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);

        // Ownership check: only the seller can approve
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.sellerId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the seller can approve item pricing" });
        }

        const item = await storage.updateItem(id, {
          status: "approved",
          priceApprovedBySeller: true,
          approvedPrice: req.body.approvedPrice || null,
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.reusseId) {
          await storage.createNotification({
            userId: item.reusseId,
            type: "item_approved",
            title: "Price Approved",
            message: `Seller approved pricing for "${item.title}".`,
            link: `/requests/${item.requestId}`,
          });
        }

        if (item.requestId && item.reusseId) {
          const request = await storage.getRequest(item.requestId);
          if (request && request.listReadyAt) {
            const existingAgreement = await storage.getAgreementByRequest(item.requestId);
            if (!existingAgreement) {
              const allItems = await storage.getItemsByRequest(item.requestId);
              const allApproved = allItems.length > 0 && allItems.every((i) => i.status === "approved");
              if (allApproved) {
                const { itemsSnapshot, feeBreakdown, totalValue } = buildAgreementSnapshot(allItems);
                const agreement = await storage.createAgreement({
                  requestId: item.requestId,
                  sellerId: request.sellerId,
                  reusseId: item.reusseId,
                  status: "pending",
                  itemCount: allItems.length,
                  totalValue,
                  itemsSnapshot,
                  feeBreakdown,
                });
                await storage.createNotification({
                  userId: request.sellerId,
                  type: "agreement_ready",
                  title: "Agreement Ready to Sign",
                  message: `An agreement for request #${item.requestId} is ready for your signature.`,
                  link: `/agreements/${agreement.id}`,
                });
                await storage.createNotification({
                  userId: item.reusseId,
                  type: "agreement_ready",
                  title: "Agreement Ready to Sign",
                  message: `An agreement for request #${item.requestId} is ready for your signature.`,
                  link: `/agreements/${agreement.id}`,
                });
                broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId: item.requestId });
                broadcastToUser(item.reusseId, { type: "agreement_ready", agreementId: agreement.id, requestId: item.requestId });
              }
            }
          }
        }

        res.json(item);
      } catch (error) {
        console.error("Error approving item:", error);
        res.status(500).json({ message: "Failed to approve item" });
      }
    },
  );

  app.post(
    "/api/items/:id/counter-offer",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);

        // Ownership check: only the seller can counter-offer
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.sellerId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the seller can counter-offer" });
        }

        const { minPrice, maxPrice } = req.body;
        const item = await storage.updateItem(id, {
          status: "pending_approval",
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          priceApprovedBySeller: false,
          sellerCounterOffer: true,
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.reusseId) {
          await storage.createNotification({
            userId: item.reusseId,
            type: "counter_offer",
            title: "Contre-offre vendeur",
            message: `Le vendeur a proposé un nouveau prix pour "${item.title}" : ${minPrice} - ${maxPrice} EUR.`,
            link: `/requests/${item.requestId}`,
          });
        }
        res.json(item);
      } catch (error) {
        console.error("Error counter-offering:", error);
        res.status(500).json({ message: "Failed to submit counter offer" });
      }
    },
  );

  app.post(
    "/api/items/:id/decline",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
          return res
            .status(400)
            .json({ message: "A decline reason is required" });
        }
        const item = await storage.updateItem(id, {
          status: "returned",
          priceApprovedBySeller: false,
          declineReason: reason.trim(),
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.reusseId) {
          await storage.createNotification({
            userId: item.reusseId,
            type: "item_declined",
            title: "Article refusé",
            message: `Le vendeur a refusé "${item.title}". Raison : ${reason.trim()}`,
            link: `/requests/${item.requestId}`,
          });
        }
        res.json(item);
      } catch (error) {
        console.error("Error declining item:", error);
        res.status(500).json({ message: "Failed to decline item" });
      }
    },
  );

  app.post(
    "/api/items/:id/duplicate",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.claims.sub;
        const original = await storage.getItem(id);
        if (!original)
          return res.status(404).json({ message: "Item not found" });
        if (original.reusseId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        if (original.requestId) {
          const parentRequest = await storage.getRequest(original.requestId);
          if (parentRequest?.listReadyAt) {
            return res.status(400).json({ message: "Item list is finalized and locked — no further changes allowed" });
          }
        }

        const duplicate = await storage.createItem({
          requestId: original.requestId || undefined,
          sellerId: original.sellerId,
          reusseId: original.reusseId || undefined,
          title: original.title,
          description: original.description || undefined,
          brand: original.brand || undefined,
          size: original.size || undefined,
          category: original.category,
          condition: original.condition || undefined,
          photos: original.photos || undefined,
          certificatePhotos: original.certificatePhotos || undefined,
          material: original.material || undefined,
          dimensions: original.dimensions || undefined,
          author: original.author || undefined,
          genre: original.genre || undefined,
          language: original.language || undefined,
          vintage: original.vintage || undefined,
          ageRange: original.ageRange || undefined,
          model: original.model || undefined,
          deviceStorage: original.deviceStorage || undefined,
          ram: original.ram || undefined,
          volume: original.volume || undefined,
          frameSize: original.frameSize || undefined,
          instrumentType: original.instrumentType || undefined,
          applianceType: original.applianceType || undefined,
          decorStyle: original.decorStyle || undefined,
          subcategory: original.subcategory || undefined,
          minPrice: original.minPrice || undefined,
          maxPrice: original.maxPrice || undefined,
          status: "pending_approval",
        });
        res.json(duplicate);
      } catch (error) {
        console.error("Error duplicating item:", error);
        res.status(500).json({ message: "Failed to duplicate item" });
      }
    },
  );

  app.post(
    "/api/items/:id/list",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);

        // Ownership check: only the assigned reusse can list
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.reusseId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the assigned reseller can list items" });
        }

        const { platformListedOn } = req.body;
        const item = await storage.updateItem(id, {
          status: "listed",
          listedAt: new Date(),
          platformListedOn: platformListedOn || null,
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.sellerId) {
          await storage.createNotification({
            userId: item.sellerId,
            type: "item_listed",
            title: "Item Listed",
            message: `"${item.title}" has been listed${platformListedOn ? ` on ${platformListedOn}` : ""}.`,
            link: `/requests/${item.requestId}`,
          });
        }

        if (item.requestId) {
          await storage.updateRequest(item.requestId, {
            status: "in_progress",
          });
        }

        res.json(item);
      } catch (error) {
        console.error("Error listing item:", error);
        res.status(500).json({ message: "Failed to list item" });
      }
    },
  );

  app.post(
    "/api/items/:id/mark-sold",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);

        // Ownership check: only the assigned reusse can mark as sold
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.reusseId !== userId) {
          return res
            .status(403)
            .json({
              message: "Only the assigned reseller can mark items as sold",
            });
        }

        const { salePrice } = req.body;
        if (!salePrice || parseFloat(salePrice) <= 0) {
          return res.status(400).json({ message: "Valid sale price required" });
        }

        const salePriceNum = parseFloat(salePrice);

        // If a signed agreement already covers this item, transactions were created
        // at signing time using the tiered model — skip creating a duplicate.
        let signedAgreementExists = false;
        if (existingItem.requestId) {
          const relatedAgreement = await storage.getAgreementByRequest(existingItem.requestId);
          if (relatedAgreement && relatedAgreement.status === "fully_signed") {
            signedAgreementExists = true;
          }
        }

        const item = await storage.updateItem(id, {
          status: "sold",
          salePrice: salePrice.toString(),
          soldAt: new Date(),
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        let transaction = null;
        if (!signedAgreementExists) {
          // No signed agreement — use tiered fee calculator
          const fees = calculateFees(salePriceNum);
          transaction = await storage.createTransaction({
            itemId: item.id,
            requestId: item.requestId || null,
            sellerId: item.sellerId,
            reusseId: item.reusseId || req.user.claims.sub,
            salePrice: salePrice.toString(),
            sellerEarning: fees.sellerAmount.toString(),
            reusseEarning: fees.resellerAmount.toString(),
            status: "completed",
          });
        }

        const sellerEarning = transaction
          ? transaction.sellerEarning
          : calculateFees(salePriceNum).sellerAmount.toFixed(2);

        await storage.createNotification({
          userId: item.sellerId,
          type: "item_sold",
          title: "Item Sold!",
          message: `"${item.title}" sold for ${salePrice} EUR. Your earnings: ${sellerEarning} EUR.`,
          link: `/items`,
        });

        res.json({ item, transaction });
      } catch (error) {
        console.error("Error marking item sold:", error);
        res.status(500).json({ message: "Failed to mark item as sold" });
      }
    },
  );

  app.patch(
    "/api/requests/:id/cancel",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });

        // Ownership check: only the seller (request owner) can cancel
        if (request.sellerId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the request owner can cancel" });
        }

        const updated = await storage.updateRequest(id, {
          status: "cancelled",
        });

        if (request.reusseId) {
          await storage.createNotification({
            userId: request.reusseId,
            type: "request_cancelled",
            title: "Request Cancelled",
            message: `Request #${id} has been cancelled.`,
            link: `/requests/${id}`,
          });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error cancelling request:", error);
        res.status(500).json({ message: "Failed to cancel request" });
      }
    },
  );

  app.patch(
    "/api/requests/:id/complete",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });

        // Ownership check: only seller or assigned reusse can complete
        if (request.sellerId !== userId && request.reusseId !== userId) {
          return res
            .status(403)
            .json({
              message:
                "Only the seller or assigned reseller can complete this request",
            });
        }

        const updated = await storage.updateRequest(id, {
          status: "completed",
          completedAt: new Date(),
        });

        const notifyUserId =
          req.user.claims.sub === request.sellerId
            ? request.reusseId
            : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "request_completed",
            title: "Request Completed",
            message: `Request #${id} has been marked as complete.`,
            link: `/requests/${id}`,
          });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error completing request:", error);
        res.status(500).json({ message: "Failed to complete request" });
      }
    },
  );

  app.get(
    "/api/earnings",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile)
          return res.status(400).json({ message: "Profile required" });
        const earnings = await storage.getEarnings(userId, profile.role);
        res.json(earnings);
      } catch (error) {
        console.error("Error fetching earnings:", error);
        res.status(500).json({ message: "Failed to fetch earnings" });
      }
    },
  );

  app.get(
    "/api/earnings-summary",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });
        const summary = await storage.getEarningsSummary(userId, profile.role);
        res.json(summary);
      } catch (error) {
        console.error("Error fetching earnings summary:", error);
        res.status(500).json({ message: "Failed to fetch earnings summary" });
      }
    },
  );

  app.get(
    "/api/stats/activity",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });
        const stats = await storage.getActivityStats(userId, profile.role);
        res.json(stats);
      } catch (error) {
        console.error("Error fetching activity stats:", error);
        res.status(500).json({ message: "Failed to fetch activity stats" });
      }
    },
  );

  app.get(
    "/api/resellers",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const resellers = await storage.getResellers();
        res.json(resellers);
      } catch (error) {
        console.error("Error fetching resellers:", error);
        res.status(500).json({ message: "Failed to fetch resellers" });
      }
    },
  );

  app.get(
    "/api/resellers/:id",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const reseller = await storage.getResellerById(req.params.id);
        if (!reseller) return res.status(404).json({ message: "Reseller not found" });
        res.json(reseller);
      } catch (error) {
        console.error("Error fetching reseller:", error);
        res.status(500).json({ message: "Failed to fetch reseller" });
      }
    },
  );

  app.get(
    "/api/resellers/:id/reviews",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const revs = await storage.getReviews(req.params.id);
        res.json(revs);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
      }
    },
  );

  app.post(
    "/api/requests/:id/review",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "seller")
          return res.status(403).json({ message: "Only sellers can leave reviews" });
        const request = await storage.getRequest(id);
        if (!request || request.sellerId !== userId)
          return res.status(403).json({ message: "Not your request" });
        if (request.status !== "completed")
          return res.status(400).json({ message: "Request must be completed to review" });
        if (!request.reusseId)
          return res.status(400).json({ message: "No reseller assigned" });
        const schema = z.object({
          rating: z.number().int().min(1).max(5),
          comment: z.string().optional(),
          communicationRating: z.number().int().min(1).max(5).optional(),
          reliabilityRating: z.number().int().min(1).max(5).optional(),
          handlingRating: z.number().int().min(1).max(5).optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid review data" });
        const review = await storage.createReview({
          requestId: id,
          sellerId: userId,
          reusseId: request.reusseId,
          ...parsed.data,
        });
        await storage.createNotification({
          userId: request.reusseId,
          type: "review_received",
          title: "Avis reçu",
          message: `Un vendeur a laissé un avis ${parsed.data.rating}/5 pour la demande #${id}.`,
          link: `/requests/${id}`,
        });
        res.json(review);
      } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Failed to create review" });
      }
    },
  );

  app.get(
    "/api/items/:id/documents",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.reusseId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const docs = await storage.getItemDocuments(itemId);
        res.json(docs.map(({ fileUrl: _omit, ...rest }) => rest));
      } catch (error) {
        console.error("Error fetching item documents:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
      }
    },
  );

  app.post(
    "/api/items/:id/documents",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.reusseId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif|pdf)$/i;
        const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
        const MAX_CERT_SIZE = 5 * 1024 * 1024;

        const schema = z.object({
          fileName: z.string().min(1).refine(
            (name) => ALLOWED_EXTENSIONS.test(name),
            { message: "Only image files (JPG, PNG, WebP, GIF) and PDFs are allowed" }
          ),
          fileUrl: z.string().min(1),
          fileType: z.enum(["photo", "certificate"]),
          fileSize: z.number().positive({ message: "fileSize is required and must be a positive number" }),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid document data", errors: parsed.error.errors });
        }
        const { fileSize, fileType, fileName } = parsed.data;
        if (fileType === "photo" && /\.pdf$/i.test(fileName)) {
          return res.status(400).json({ message: "PDF files cannot be uploaded as photos. Select 'Certificate' type for PDFs." });
        }
        const maxSize = fileType === "photo" ? MAX_PHOTO_SIZE : MAX_CERT_SIZE;
        if (fileSize > maxSize) {
          const limitMB = maxSize / (1024 * 1024);
          return res.status(400).json({ message: `File too large. ${fileType === "photo" ? "Photos" : "Documents"} must be under ${limitMB}MB.` });
        }
        if (!parsed.data.fileUrl.startsWith("/objects/")) {
          return res.status(400).json({ message: "Invalid file URL: must be an uploaded object path" });
        }

        const existingDocs = await storage.getItemDocuments(itemId);
        const MAX_PHOTOS_PER_ITEM = 5;
        const MAX_CERTS_PER_ITEM = 3;
        if (parsed.data.fileType === "photo") {
          const photoCount = existingDocs.filter((d) => d.fileType === "photo").length;
          if (photoCount >= MAX_PHOTOS_PER_ITEM) {
            return res.status(400).json({ message: `Maximum of ${MAX_PHOTOS_PER_ITEM} photos allowed per item.` });
          }
        } else {
          const certCount = existingDocs.filter((d) => d.fileType === "certificate").length;
          if (certCount >= MAX_CERTS_PER_ITEM) {
            return res.status(400).json({ message: `Maximum of ${MAX_CERTS_PER_ITEM} certificates allowed per item.` });
          }
        }

        const doc = await storage.createItemDocument({
          itemId,
          uploaderUserId: userId,
          fileName: parsed.data.fileName,
          fileUrl: parsed.data.fileUrl,
          fileType: parsed.data.fileType,
          fileSize: parsed.data.fileSize || null,
        });

        const notifyUserId = userId === item.sellerId ? item.reusseId : item.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "new_document",
            title: "New Document Uploaded",
            message: `A new document "${parsed.data.fileName}" was uploaded for item "${item.title}".`,
            link: `/requests/${item.requestId}`,
          });
          broadcastToUser(notifyUserId, {
            type: "new_document",
            itemId,
            fileName: parsed.data.fileName,
            itemTitle: item.title,
          });
        }

        res.json(doc);
      } catch (error) {
        console.error("Error creating item document:", error);
        res.status(500).json({ message: "Failed to save document" });
      }
    },
  );

  app.post(
    "/api/items/:id/document-request",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "reusse") {
          return res.status(403).json({ message: "Only resellers can request documents" });
        }
        if (item.reusseId !== userId) {
          return res.status(403).json({ message: "Not assigned to this item" });
        }
        const existing = await storage.getDocumentRequestStatus(itemId, userId);
        if (existing) {
          return res.status(409).json({ message: "Document request already sent for this item", alreadyRequested: true });
        }
        try {
          await storage.createDocumentRequest(itemId, userId);
        } catch (err: any) {
          if (err?.code === "23505") {
            return res.status(409).json({ message: "Document request already sent for this item", alreadyRequested: true });
          }
          throw err;
        }
        const content = `📄 I'd like to request additional documentation for "${item.title}". Please upload authenticity certificates, purchase receipts, or any relevant documents.`;
        const message = await storage.createMessage({
          senderId: userId,
          receiverId: item.sellerId,
          content,
          requestId: item.requestId || null,
        });
        broadcastToUser(item.sellerId, { type: "new_message", message });
        broadcastToUser(userId, { type: "new_message", message });
        await storage.createNotification({
          userId: item.sellerId,
          type: "document_request",
          title: "Document Request",
          message: `Your reseller is requesting additional documentation for "${item.title}".`,
          link: item.requestId ? `/requests/${item.requestId}` : `/items`,
        });
        broadcastToUser(item.sellerId, {
          type: "document_request",
          itemId,
          itemTitle: item.title,
        });
        res.json({ success: true, message });
      } catch (error) {
        console.error("Error sending document request:", error);
        res.status(500).json({ message: "Failed to send document request" });
      }
    },
  );

  app.get(
    "/api/items/:id/document-request-status",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.reusseId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const requestUserId = profile?.role === "reusse" ? userId : item.reusseId;
        const existing = requestUserId
          ? await storage.getDocumentRequestStatus(itemId, requestUserId)
          : null;
        res.json({ requested: !!existing, requestedAt: existing?.createdAt || null });
      } catch (error) {
        console.error("Error checking document request status:", error);
        res.status(500).json({ message: "Failed to check status" });
      }
    },
  );

  app.get(
    "/api/items/:id/documents/:docId/download",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const itemId = parseInt(req.params.id);
        const docId = parseInt(req.params.docId);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.reusseId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const doc = await storage.getItemDocument(docId);
        if (!doc || doc.itemId !== itemId) {
          return res.status(404).json({ message: "Document not found" });
        }
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(doc.fileUrl);
        await objectStorageService.downloadObject(objectFile, res, 0);
      } catch (error: any) {
        const isNotFound =
          error?.code === "NOT_FOUND" ||
          error?.message?.toLowerCase().includes("not found") ||
          error?.message?.toLowerCase().includes("no such object") ||
          error?.statusCode === 404;
        if (isNotFound) {
          return res.status(404).json({ message: "Document file not found in storage" });
        }
        console.error("Error serving document:", error);
        res.status(500).json({ message: "Failed to serve document" });
      }
    },
  );

  app.get(
    "/api/documents",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const docs = await storage.getDocumentsByUser(userId);
        res.json(docs.map(({ fileUrl: _omit, ...rest }) => rest));
      } catch (error) {
        console.error("Error fetching user documents:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
      }
    },
  );

  app.delete(
    "/api/items/:id/documents/:docId",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const itemId = parseInt(req.params.id);
        const docId = parseInt(req.params.docId);
        const doc = await storage.getItemDocument(docId);
        if (!doc || doc.itemId !== itemId) {
          return res.status(404).json({ message: "Document not found" });
        }
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && doc.uploaderUserId !== userId) {
          return res.status(403).json({ message: "Not authorized to delete this document" });
        }
        await storage.deleteItemDocument(docId);
        res.json({ message: "Document deleted" });
      } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Failed to delete document" });
      }
    },
  );

  app.post(
    "/api/requests/:id/finalize-list",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "reusse") {
          return res.status(403).json({ message: "Only resellers can finalize the item list" });
        }
        const request = await storage.getRequest(id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.reusseId !== userId) return res.status(403).json({ message: "Not assigned to this request" });
        if (request.listReadyAt) return res.status(409).json({ message: "List already finalized" });

        const existingItems = await storage.getItemsByRequest(id);
        if (existingItems.length === 0) {
          return res.status(400).json({ message: "Cannot finalize an empty item list" });
        }

        const updated = await storage.updateRequest(id, { listReadyAt: new Date() });

        await storage.createNotification({
          userId: request.sellerId,
          type: "list_finalized",
          title: "Item List Finalized",
          message: `The reseller has finalized the item list for request #${id}. Please review and approve all items.`,
          link: `/requests/${id}`,
        });

        const items = await storage.getItemsByRequest(id);
        const allApproved = items.length > 0 && items.every((i) => i.status === "approved");
        if (allApproved) {
          const existingAgreement = await storage.getAgreementByRequest(id);
          if (!existingAgreement) {
            const { itemsSnapshot, feeBreakdown, totalValue } = buildAgreementSnapshot(items);
            const agreement = await storage.createAgreement({
              requestId: id,
              sellerId: request.sellerId,
              reusseId: userId,
              status: "pending",
              itemCount: items.length,
              totalValue,
              itemsSnapshot,
              feeBreakdown,
            });
            await storage.createNotification({
              userId: request.sellerId,
              type: "agreement_ready",
              title: "Agreement Ready to Sign",
              message: `An agreement for request #${id} is ready for your signature.`,
              link: `/agreements/${agreement.id}`,
            });
            await storage.createNotification({
              userId,
              type: "agreement_ready",
              title: "Agreement Ready to Sign",
              message: `An agreement for request #${id} is ready for your signature.`,
              link: `/agreements/${agreement.id}`,
            });
            broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId: id });
            broadcastToUser(userId, { type: "agreement_ready", agreementId: agreement.id, requestId: id });
          }
        }

        res.json(updated);
      } catch (error) {
        console.error("Error finalizing list:", error);
        res.status(500).json({ message: "Failed to finalize list" });
      }
    },
  );

  app.get(
    "/api/requests/:id/agreement",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        const request = await storage.getRequest(id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        const isAdmin = profile?.role === "admin";
        const isParticipant = request.sellerId === userId || request.reusseId === userId;
        if (!isAdmin && !isParticipant) {
          return res.status(403).json({ message: "Not authorized to view this agreement" });
        }
        const agreement = await storage.getAgreementByRequest(id);
        if (!agreement) return res.json(null);
        res.json(agreement);
      } catch (error) {
        console.error("Error fetching agreement:", error);
        res.status(500).json({ message: "Failed to fetch agreement" });
      }
    },
  );

  app.post(
    "/api/requests/:id/generate-agreement",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const requestId = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        const request = await storage.getRequest(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });
        const isAdmin = profile?.role === "admin";
        const isParticipant = request.sellerId === userId || request.reusseId === userId;
        if (!isAdmin && !isParticipant) {
          return res.status(403).json({ message: "Not authorized" });
        }
        if (!request.listReadyAt) {
          return res.status(400).json({ message: "Item list not yet finalized" });
        }
        if (!request.reusseId) {
          return res.status(400).json({ message: "No reseller assigned" });
        }
        const existing = await storage.getAgreementByRequest(requestId);
        if (existing) return res.json(existing);
        const items = await storage.getItemsByRequest(requestId);
        if (items.length === 0) {
          return res.status(400).json({ message: "No items found for this request" });
        }
        const allApproved = items.every((i) => i.status === "approved");
        if (!allApproved) {
          return res.status(400).json({ message: "Not all items are approved yet" });
        }
        const { itemsSnapshot, feeBreakdown, totalValue } = buildAgreementSnapshot(items);
        const agreement = await storage.createAgreement({
          requestId,
          sellerId: request.sellerId,
          reusseId: request.reusseId,
          status: "pending",
          itemCount: items.length,
          totalValue,
          itemsSnapshot,
          feeBreakdown,
        });
        await storage.createNotification({
          userId: request.sellerId,
          type: "agreement_ready",
          title: "Agreement Ready to Sign",
          message: `An agreement for request #${requestId} is ready for your signature.`,
          link: `/agreements/${agreement.id}`,
        });
        await storage.createNotification({
          userId: request.reusseId,
          type: "agreement_ready",
          title: "Agreement Ready to Sign",
          message: `An agreement for request #${requestId} is ready for your signature.`,
          link: `/agreements/${agreement.id}`,
        });
        broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId });
        broadcastToUser(request.reusseId, { type: "agreement_ready", agreementId: agreement.id, requestId });
        res.json(agreement);
      } catch (error) {
        console.error("Error generating agreement:", error);
        res.status(500).json({ message: "Failed to generate agreement" });
      }
    },
  );

  app.get(
    "/api/agreements/:id",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        const agreement = await storage.getAgreementWithDetails(id);
        if (!agreement) return res.status(404).json({ message: "Agreement not found" });
        if (profile?.role !== "admin" && agreement.sellerId !== userId && agreement.reusseId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        res.json(agreement);
      } catch (error) {
        console.error("Error fetching agreement:", error);
        res.status(500).json({ message: "Failed to fetch agreement" });
      }
    },
  );

  app.post(
    "/api/agreements/:id/sign",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });

        const { agreed } = req.body;
        if (agreed !== true) {
          return res.status(400).json({ message: "You must agree to sign this agreement (agreed: true)" });
        }

        const agreement = await storage.getAgreement(id);
        if (!agreement) return res.status(404).json({ message: "Agreement not found" });

        if (agreement.sellerId !== userId && agreement.reusseId !== userId) {
          return res.status(403).json({ message: "Not a party to this agreement" });
        }

        const existingSig = await storage.getAgreementSignature(id, userId);
        if (existingSig) return res.status(409).json({ message: "Already signed this agreement" });

        const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
        const role = agreement.sellerId === userId ? "seller" : "reusse";

        await storage.createAgreementSignature({ agreementId: id, userId, role, ipAddress });

        const allSigs = await storage.getAgreementSignatures(id);
        const hasSeller = allSigs.some((s) => s.userId === agreement.sellerId);
        const hasReusse = allSigs.some((s) => s.userId === agreement.reusseId);

        let newStatus = agreement.status;
        if (hasSeller && hasReusse) {
          newStatus = "fully_signed";
        } else if (hasSeller) {
          newStatus = "seller_signed";
        } else if (hasReusse) {
          newStatus = "reseller_signed";
        }

        await storage.updateAgreementStatus(id, newStatus);

        const otherUserId = agreement.sellerId === userId ? agreement.reusseId : agreement.sellerId;
        await storage.createNotification({
          userId: otherUserId,
          type: "agreement_signed",
          title: newStatus === "fully_signed" ? "Agreement Fully Signed" : "Agreement Partially Signed",
          message: newStatus === "fully_signed"
            ? `Agreement for request #${agreement.requestId} has been fully signed by both parties.`
            : `${profile.role === "seller" ? "The seller" : "The reseller"} has signed the agreement for request #${agreement.requestId}.`,
          link: `/agreements/${id}`,
        });

        if (newStatus === "fully_signed") {
          const requestItems = await storage.getItemsByRequest(agreement.requestId);
          const parsedItems = JSON.parse(agreement.itemsSnapshot);
          for (const snapItem of parsedItems) {
            const price = snapItem.approvedPrice;
            const fees = calculateFees(price);
            const matchingItem = requestItems.find((i) => i.id === snapItem.id);
            if (matchingItem) {
              const existingTxn = await storage.getTransactionByItemId(matchingItem.id);
              if (!existingTxn) {
                await storage.createTransaction({
                  itemId: matchingItem.id,
                  requestId: agreement.requestId,
                  sellerId: agreement.sellerId,
                  reusseId: agreement.reusseId,
                  salePrice: price.toString(),
                  sellerEarning: fees.sellerAmount.toString(),
                  reusseEarning: fees.resellerAmount.toString(),
                  status: "completed",
                });
              }
            }
          }
        }

        const updated = await storage.getAgreementWithDetails(id);
        res.json(updated);
      } catch (error) {
        console.error("Error signing agreement:", error);
        res.status(500).json({ message: "Failed to sign agreement" });
      }
    },
  );

  app.get(
    "/api/admin/agreements",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const result = await storage.getAdminAgreements();
        res.json(result);
      } catch (error) {
        console.error("Error fetching admin agreements:", error);
        res.status(500).json({ message: "Failed to fetch agreements" });
      }
    },
  );

  app.post(
    "/api/requests/:id/report",
    isAuthenticated,
    requireAuth,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.claims.sub;
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "reusse")
          return res.status(403).json({ message: "Only resellers can report requests" });
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });
        const schema = z.object({ reason: z.string().min(1) });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
          return res.status(400).json({ message: "Reason required" });
        await storage.reportRequest(id, userId, parsed.data.reason);
        const admins = await storage.getAllUsersWithProfiles();
        const adminIds = admins
          .filter((u: any) => u.profile?.role === "admin")
          .map((u: any) => u.id);
        await Promise.all(
          adminIds.map((adminId: string) =>
            storage.createNotification({
              userId: adminId,
              type: "request_flagged",
              title: "Demande signalée",
              message: `La demande #${id} a été signalée par un revendeur : ${parsed.data.reason}`,
              link: `/admin/requests`,
            })
          )
        );
        res.json({ message: "Request reported" });
      } catch (error) {
        console.error("Error reporting request:", error);
        res.status(500).json({ message: "Failed to report request" });
      }
    },
  );

  return httpServer;
}

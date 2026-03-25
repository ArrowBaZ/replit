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
import { ITEM_CATEGORIES } from "@shared/schema";

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
  condition: z.string().optional(),
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

const CATEGORY_ALLOWED_FIELDS: Partial<Record<typeof ITEM_CATEGORIES[number], string[]>> = {
  vetements: ["brand", "size", "condition"],
  tout_mode: [],
  montres_bijoux: ["brand", "material", "condition", "certificatePhotos"],
  accessoires_bagagerie: ["brand", "subcategory", "condition", "certificatePhotos"],
  ameublement: ["brand", "material", "dimensions", "condition"],
  electromenager: ["brand", "applianceType", "condition"],
  decoration: ["decorStyle", "material", "condition"],
  linge_de_maison: ["subcategory", "size", "condition"],
  electronique: ["brand", "subcategory", "condition"],
  ordinateurs: ["brand", "ram", "deviceStorage", "condition"],
  telephones_objets_connectes: ["brand", "model", "deviceStorage", "condition"],
  livres: ["author", "genre", "language", "condition"],
  vins: ["subcategory", "vintage", "volume"],
  instruments_de_musique: ["instrumentType", "brand", "condition"],
  jeux_jouets: ["ageRange", "brand", "condition"],
  velos: ["brand", "subcategory", "frameSize", "condition"],
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
        const id = parseInt(req.params.id);
        await storage.markNotificationRead(id);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Failed to update notification" });
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
        const sellerEarning = (salePriceNum * 0.8).toFixed(2);
        const reusseEarning = (salePriceNum * 0.2).toFixed(2);

        const item = await storage.updateItem(id, {
          status: "sold",
          salePrice: salePrice.toString(),
          soldAt: new Date(),
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        const transaction = await storage.createTransaction({
          itemId: item.id,
          requestId: item.requestId || null,
          sellerId: item.sellerId,
          reusseId: item.reusseId || req.user.claims.sub,
          salePrice: salePrice.toString(),
          sellerEarning,
          reusseEarning,
          status: "completed",
        });

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

  return httpServer;
}

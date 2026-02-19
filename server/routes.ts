import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/routes";

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
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  app.get("/api/profile", isAuthenticated, requireAuth, async (req: any, res) => {
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
  });

  app.post("/api/profile", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existing = await storage.getProfile(userId);
      if (existing) {
        return res.status(400).json({ message: "Profile already exists" });
      }
      const { role, phone, address, city, postalCode, department, bio, experience, siretNumber, preferredContactMethod } = req.body;
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
  });

  app.patch("/api/profile", isAuthenticated, requireAuth, async (req: any, res) => {
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
  });

  app.get("/api/requests", isAuthenticated, requireAuth, async (req: any, res) => {
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
  });

  app.get("/api/requests/available", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const result = await storage.getAvailableRequests();
      res.json(result);
    } catch (error) {
      console.error("Error fetching available requests:", error);
      res.status(500).json({ message: "Failed to fetch available requests" });
    }
  });

  app.get("/api/requests/:id", isAuthenticated, requireAuth, async (req: any, res) => {
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
  });

  app.post("/api/requests", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { serviceType, itemCount, estimatedValue, meetingLocation, notes } = req.body;
      const request = await storage.createRequest({
        sellerId: userId,
        serviceType,
        status: "pending",
        itemCount,
        estimatedValue: estimatedValue || null,
        meetingLocation: meetingLocation || null,
        notes: notes || null,
      });
      res.json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.post("/api/requests/:id/accept", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (!profile || profile.role !== "reusse") {
        return res.status(403).json({ message: "Only Reusses can accept requests" });
      }
      if (profile.status !== "approved") {
        return res.status(403).json({ message: "Reusse must be approved" });
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
        message: "A Reusse has been assigned to your request!",
        link: `/requests/${request.id}`,
      });

      res.json(request);
    } catch (error) {
      console.error("Error accepting request:", error);
      res.status(500).json({ message: "Failed to accept request" });
    }
  });

  app.get("/api/requests/:id/items", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getItemsByRequest(id);
      res.json(result);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post("/api/requests/:id/items", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      const { title, description, brand, size, category, condition, minPrice, maxPrice } = req.body;
      const item = await storage.createItem({
        requestId,
        sellerId: request.sellerId,
        reusseId: userId,
        title,
        description: description || null,
        brand: brand || null,
        size: size || null,
        category,
        condition,
        status: "pending_approval",
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
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
  });

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

  app.get("/api/requests/:id/meetings", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getMeetingsByRequest(id);
      res.json(result);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.post("/api/requests/:id/meetings", isAuthenticated, requireAuth, async (req: any, res) => {
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

      const notifyUserId = req.user.claims.sub === request.sellerId ? request.reusseId : request.sellerId;
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
  });

  app.get("/api/meetings", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.getMeetings(userId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get("/api/messages/conversations", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.getConversations(userId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      const result = await storage.getMessagesBetween(currentUserId, otherUserId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { receiverId, content, requestId } = req.body;
      const message = await storage.createMessage({
        senderId,
        receiverId,
        content,
        requestId: requestId || null,
      });
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/notifications", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.getNotifications(userId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const result = await storage.getAllUsersWithProfiles();
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/applications", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const result = await storage.getPendingReusses();
      res.json(result);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/applications/:userId", isAuthenticated, requireAdmin, async (req: any, res) => {
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
        title: status === "approved" ? "Application Approved" : "Application Update",
        message: status === "approved"
          ? "Your Reusse application has been approved! You can now accept seller requests."
          : "Your Reusse application status has been updated.",
      });

      res.json(profile);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}

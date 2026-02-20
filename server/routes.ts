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
      const { serviceType, itemCount, estimatedValue, categories, condition, brands, meetingLocation, preferredDateStart, preferredDateEnd, notes } = req.body;
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
        preferredDateStart: preferredDateStart ? new Date(preferredDateStart) : null,
        preferredDateEnd: preferredDateEnd ? new Date(preferredDateEnd) : null,
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
        return res.status(403).json({ message: "Only resellers can accept requests" });
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
      const { title, description, brand, size, category, condition, minPrice, maxPrice, photos } = req.body;
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
        photos: photos || null,
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

  app.patch("/api/meetings/:meetingId/cancel", isAuthenticated, requireAuth, async (req: any, res) => {
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
      const updated = await storage.updateMeeting(meetingId, { status: "cancelled" });
      const notifyUserId = userId === request.sellerId ? request.reusseId : request.sellerId;
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
  });

  app.patch("/api/meetings/:meetingId/reschedule", isAuthenticated, requireAuth, async (req: any, res) => {
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
      const notifyUserId = userId === request.sellerId ? request.reusseId : request.sellerId;
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
          ? "Your reseller application has been approved! You can now accept seller requests."
          : "Your reseller application status has been updated.",
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

  app.post("/api/items/:id/approve", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
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
  });

  app.post("/api/items/:id/counter-offer", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { minPrice, maxPrice } = req.body;
      const item = await storage.updateItem(id, {
        status: "pending_approval",
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        priceApprovedBySeller: false,
        updatedAt: new Date(),
      });
      if (!item) return res.status(404).json({ message: "Item not found" });

      if (item.reusseId) {
        await storage.createNotification({
          userId: item.reusseId,
          type: "counter_offer",
          title: "Counter Offer",
          message: `Seller suggested a different price for "${item.title}".`,
          link: `/requests/${item.requestId}`,
        });
      }
      res.json(item);
    } catch (error) {
      console.error("Error counter-offering:", error);
      res.status(500).json({ message: "Failed to submit counter offer" });
    }
  });

  app.post("/api/items/:id/decline", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateItem(id, {
        status: "returned",
        priceApprovedBySeller: false,
        updatedAt: new Date(),
      });
      if (!item) return res.status(404).json({ message: "Item not found" });

      if (item.reusseId) {
        await storage.createNotification({
          userId: item.reusseId,
          type: "item_declined",
          title: "Item Declined",
          message: `Seller declined "${item.title}".`,
          link: `/requests/${item.requestId}`,
        });
      }
      res.json(item);
    } catch (error) {
      console.error("Error declining item:", error);
      res.status(500).json({ message: "Failed to decline item" });
    }
  });

  app.post("/api/items/:id/list", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
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
        await storage.updateRequest(item.requestId, { status: "in_progress" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error listing item:", error);
      res.status(500).json({ message: "Failed to list item" });
    }
  });

  app.post("/api/items/:id/mark-sold", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
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
  });

  app.patch("/api/requests/:id/cancel", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });

      const updated = await storage.updateRequest(id, { status: "cancelled" });

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
  });

  app.patch("/api/requests/:id/complete", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });

      const updated = await storage.updateRequest(id, { status: "completed", completedAt: new Date() });

      const notifyUserId = req.user.claims.sub === request.sellerId ? request.reusseId : request.sellerId;
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
  });

  app.get("/api/earnings", isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (!profile) return res.status(400).json({ message: "Profile required" });
      const earnings = await storage.getEarnings(userId, profile.role);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  return httpServer;
}

import express from "express";
import mongoose from "mongoose";

import Enterprise from "../models/Enterprise.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/services/public", async (_req, res) => {
  try {
    const services = await Enterprise.find({ isArchived: { $ne: true } })
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 });
    return res.json(services);
  } catch (error) {
    console.error("Public services fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch public services" });
  }
});

router.get("/services/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const service = await Enterprise.findOne({
      _id: id,
      isArchived: { $ne: true },
    }).populate("userId", "name avatarUrl");
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json(service);
  } catch (error) {
    console.error("Public service fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch public service" });
  }
});

router.get("/providers/public/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    if (!isValidObjectId(providerId)) {
      return res.status(400).json({ message: "Invalid provider id" });
    }

    const provider = await User.findOne({ _id: providerId, role: "enterprise" })
      .select("name createdAt avatarUrl");
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const services = await Enterprise.find({
      userId: providerId,
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 });

    return res.json({ provider, services });
  } catch (error) {
    console.error("Provider profile fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch provider profile" });
  }
});

router.use(requireAuth, requireRole(["enterprise"]));

router.post("/:enterpriseId/services", async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const { subject, bio, price, availability, category } = req.body;

    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }

    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only manage your own services" });
    }

    const enterpriseUser = await User.findOne({ _id: enterpriseId, role: "enterprise" });
    if (!enterpriseUser) {
      return res.status(404).json({ message: "Enterprise user not found" });
    }

    if (!subject || price === undefined || price === null) {
      return res.status(400).json({ message: "subject and price are required" });
    }
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "price must be a non-negative number" });
    }

    const service = await Enterprise.create({
      userId: enterpriseId,
      subject,
      category,
      bio,
      price,
      availability,
    });

    return res.status(201).json(service);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Service creation error:", error.message);
    return res.status(500).json({ message: "Failed to create service" });
  }
});

router.get("/:enterpriseId/services", async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }
    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only view your own services" });
    }

    const services = await Enterprise.find({ userId: enterpriseId }).sort({ createdAt: -1 });
    return res.json(services);
  } catch (error) {
    console.error("Services fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch services" });
  }
});

router.get("/:enterpriseId/services/:id", async (req, res) => {
  try {
    const { enterpriseId, id } = req.params;
    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }
    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only view your own services" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const service = await Enterprise.findOne({ _id: id, userId: enterpriseId });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json(service);
  } catch (error) {
    console.error("Service fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch service" });
  }
});

router.patch("/:enterpriseId/services/:id", async (req, res) => {
  try {
    const { enterpriseId, id } = req.params;
    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }
    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only update your own services" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const allowedFields = ["subject", "category", "bio", "price", "availability", "isArchived"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }
    if (updates.price !== undefined && (typeof updates.price !== "number" || updates.price < 0)) {
      return res.status(400).json({ message: "price must be a non-negative number" });
    }
    if (updates.isArchived !== undefined && typeof updates.isArchived !== "boolean") {
      return res.status(400).json({ message: "isArchived must be a boolean" });
    }
    if (updates.isArchived === true) {
      updates.archivedAt = new Date();
    }
    if (updates.isArchived === false) {
      updates.archivedAt = null;
    }

    const service = await Enterprise.findOneAndUpdate(
      { _id: id, userId: enterpriseId },
      updates,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json(service);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Service update error:", error.message);
    return res.status(500).json({ message: "Failed to update service" });
  }
});

router.delete("/:enterpriseId/services/:id", async (req, res) => {
  try {
    const { enterpriseId, id } = req.params;
    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }
    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only delete your own services" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const deletedService = await Enterprise.findOneAndDelete({
      _id: id,
      userId: enterpriseId,
    });
    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    return res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Service delete error:", error.message);
    return res.status(500).json({ message: "Failed to delete service" });
  }
});

router.get("/:enterpriseId/bookings", async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }
    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only view your own bookings" });
    }

    const services = await Enterprise.find({ userId: enterpriseId }).select("_id");
    const serviceIds = services.map((service) => service._id);

    const bookings = await Booking.find({ enterpriseId: { $in: serviceIds } })
      .populate("userId", "name email")
      .populate("enterpriseId", "subject price")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    console.error("Bookings fetch error:", error.message);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.patch("/:enterpriseId/bookings/:id/status", async (req, res) => {
  try {
    const { enterpriseId, id } = req.params;
    if (!isValidObjectId(enterpriseId)) {
      return res.status(400).json({ message: "Invalid enterprise id" });
    }
    if (req.session.user.id !== enterpriseId) {
      return res.status(403).json({ message: "You can only update bookings for your own services" });
    }
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const { status } = req.body;
    const allowedStatuses = ["pending", "confirmed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const booking = await Booking.findById(id).populate("enterpriseId", "userId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.enterpriseId || String(booking.enterpriseId.userId) !== String(enterpriseId)) {
      return res.status(403).json({ message: "You cannot modify this booking" });
    }

    booking.status = status;
    await booking.save();

    return res.json(booking);
  } catch (error) {
    console.error("Booking status update error:", error.message);
    return res.status(500).json({ message: "Failed to update booking status" });
  }
});

export default router;

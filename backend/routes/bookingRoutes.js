import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Enterprise from "../models/Enterprise.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", requireRole(["user"]), async (req, res) => {
  try {
    const { enterpriseId, bookingDate, notes } = req.body;
    const userId = req.session.user.id;

    if (!enterpriseId || !bookingDate) {
      return res
        .status(400)
        .json({ message: "enterpriseId and bookingDate are required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(enterpriseId)
    ) {
      return res.status(400).json({ message: "Invalid userId or enterpriseId" });
    }

    const enterpriseService = await Enterprise.findById(enterpriseId);
    if (!enterpriseService) {
      return res.status(404).json({ message: "Enterprise service not found" });
    }

    if (enterpriseService.userId.toString() === userId) {
      return res.status(400).json({ message: "You cannot book your own service" });
    }

    const parsedDate = new Date(bookingDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "bookingDate must be a valid date" });
    }

    const newBooking = await Booking.create({
      userId,
      enterpriseId,
      bookingDate: parsedDate,
      notes,
      status: "pending",
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { enterpriseId } = req.query;
    const filter = {};
    const sessionUserId = req.session.user.id;
    const sessionRole = req.session.user.role;

    if (sessionRole === "user") {
      filter.userId = sessionUserId;
    }

    if (sessionRole === "enterprise") {
      const ownServices = await Enterprise.find({ userId: sessionUserId }).select("_id");
      filter.enterpriseId = { $in: ownServices.map((s) => s._id) };
    }

    if (enterpriseId && sessionRole === "enterprise") {
      if (!mongoose.Types.ObjectId.isValid(enterpriseId)) {
        return res.status(400).json({ message: "Invalid enterpriseId query" });
      }

      const ownService = await Enterprise.findOne({
        _id: enterpriseId,
        userId: sessionUserId,
      }).select("_id");
      if (!ownService) {
        return res.status(403).json({ message: "You can only query your own services" });
      }
      filter.enterpriseId = ownService._id;
    }

    const bookings = await Booking.find(filter)
      .populate("userId", "name email role")
      .populate("enterpriseId", "subject price userId")
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email role")
      .populate("enterpriseId", "subject price userId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const sessionUserId = req.session.user.id;
    const sessionRole = req.session.user.role;

    if (
      sessionRole === "user" &&
      booking.userId?._id?.toString() !== sessionUserId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (sessionRole === "enterprise") {
      const service = await Enterprise.findById(booking.enterpriseId?._id || booking.enterpriseId);
      if (!service || service.userId.toString() !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.patch("/:id", requireRole(["user"]), async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only update your own booking" });
    }

    const { bookingDate, notes } = req.body;
    const updates = {};

    if (bookingDate !== undefined) {
      const parsedDate = new Date(bookingDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "bookingDate must be a valid date" });
      }
      updates.bookingDate = parsedDate;
    }
    if (notes !== undefined) updates.notes = notes;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No allowed fields to update" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.delete("/:id", requireRole(["user"]), async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.session.user.id) {
      return res.status(403).json({ message: "You can only delete your own booking" });
    }

    const deleted = await Booking.findByIdAndDelete(bookingId);
    if (!deleted) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.patch(
  "/:id/status",
  requireRole(["enterprise"]),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: "Invalid booking id" });
      }

      if (!["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const service = await Enterprise.findById(booking.enterpriseId);
      if (!service || service.userId.toString() !== req.session.user.id) {
        return res.status(403).json({ message: "You can only update bookings for your services" });
      }

      booking.status = status;
      if (status === "confirmed") {
        booking.confirmedAt = new Date();
      } else if (status === "cancelled" || status === "pending") {
        booking.confirmedAt = null;
      }
      await booking.save();

      return res.status(200).json({
        message: "Booking status updated",
        booking,
      });
    } catch (error) {
      console.error("Booking status update error:", error.message);
      return res.status(500).json({ message: "Failed to update booking status" });
    }
  }
);

export default router;

import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Enterprise from "../models/Enterprise.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/*
 * Bookings are now keyed on the instructor's user account rather than on an
 * Enterprise listing, so every ownership check here is a direct comparison
 * instead of a detour through the services table.
 */

router.use(requireAuth);

/* Both roles read bookings with the same shape. */
const populateBooking = (query) =>
  query
    .populate("userId", "name email role")
    .populate("instructorId", "name email avatarUrl")
    .populate("serviceId", "subject price");

/* ── POST /api/booking — a learner requests a lesson ───────────────────── */
router.post("/", requireRole(["user"]), async (req, res) => {
  try {
    const { instructorId, serviceId, bookingDate, notes } = req.body;
    const userId = req.session.user.id;

    if (!instructorId || !bookingDate) {
      return res
        .status(400)
        .json({ message: "instructorId and bookingDate are required" });
    }

    if (!isValidObjectId(instructorId)) {
      return res.status(400).json({ message: "Invalid instructorId" });
    }

    if (instructorId === userId) {
      return res.status(400).json({ message: "You cannot book yourself" });
    }

    const instructor = await User.findOne({
      _id: instructorId,
      role: "enterprise",
    }).select("_id");
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    /* Optional listing link, only used by the Other category. It must belong
       to the instructor being booked, or it is a way to attach someone else's
       listing to this booking. */
    let resolvedServiceId = null;
    if (serviceId) {
      if (!isValidObjectId(serviceId)) {
        return res.status(400).json({ message: "Invalid serviceId" });
      }
      const service = await Enterprise.findOne({
        _id: serviceId,
        userId: instructorId,
      }).select("_id");
      if (!service) {
        return res
          .status(400)
          .json({ message: "That service does not belong to this instructor" });
      }
      resolvedServiceId = service._id;
    }

    const parsedDate = new Date(bookingDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "bookingDate must be a valid date" });
    }

    const newBooking = await Booking.create({
      userId,
      instructorId,
      serviceId: resolvedServiceId,
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

/* ── GET /api/booking — mine, whichever side I am on ───────────────────── */
router.get("/", async (req, res) => {
  try {
    const sessionUserId = req.session.user.id;
    const sessionRole = req.session.user.role;

    /* A learner sees the requests they made; an instructor sees the requests
       made to them. One field decides it either way. */
    const filter =
      sessionRole === "user"
        ? { userId: sessionUserId }
        : { instructorId: sessionUserId };

    const bookings = await populateBooking(Booking.find(filter)).sort({
      createdAt: -1,
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

/* ── GET /api/booking/:id ──────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await populateBooking(Booking.findById(bookingId));
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    /* Only the two parties to a booking may read it. */
    const sessionUserId = req.session.user.id;
    const learnerId = String(booking.userId?._id ?? booking.userId);
    const instructorId = String(booking.instructorId?._id ?? booking.instructorId);

    if (sessionUserId !== learnerId && sessionUserId !== instructorId) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

/* ── PATCH /api/booking/:id — the learner edits their own request ──────── */
router.patch("/:id", requireRole(["user"]), async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!isValidObjectId(bookingId)) {
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

/* ── DELETE /api/booking/:id ───────────────────────────────────────────── */
router.delete("/:id", requireRole(["user"]), async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const deleted = await Booking.findOneAndDelete({
      _id: bookingId,
      userId: req.session.user.id,
    });

    if (!deleted) {
      /* Either it does not exist or it is not theirs. Saying which would leak
         whether a given booking id exists. */
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking error:", error.message);
    return res.status(500).json({ message: "An error occurred" });
  }
});

/* ── PATCH /api/booking/:id/status — the instructor accepts or declines ── */
router.patch("/:id/status", requireRole(["enterprise"]), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      instructorId: req.session.user.id,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found" });
    }

    booking.status = status;
    /* This timestamp is what the Phase 2 response-time indicator measures
       against createdAt, so it is only set on a real confirmation. */
    booking.confirmedAt = status === "confirmed" ? new Date() : null;
    await booking.save();

    return res.status(200).json({
      message: "Booking status updated",
      booking,
    });
  } catch (error) {
    console.error("Booking status update error:", error.message);
    return res.status(500).json({ message: "Failed to update booking status" });
  }
});

export default router;

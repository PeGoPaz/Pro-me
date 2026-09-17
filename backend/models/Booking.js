import mongoose from "mongoose";

/*
 * A lesson request from a learner to an instructor.
 *
 * This used to hang off `enterpriseId` — a row in the Enterprise "services"
 * table from the old multi-vertical marketplace. That made a booking a request
 * against a *listing*, which never fitted driving lessons: a learner books a
 * person, and every ownership check had to detour through Enterprise to find
 * out who that person was.
 *
 * It now points straight at the instructor's user account. `serviceId` stays as
 * an optional link for the `Other` category, which still works in terms of
 * listings.
 *
 * Note: the platform never handles lesson money. A booking is an introduction
 * and a scheduling record; the learner pays the instructor directly.
 */

const bookingSchema = new mongoose.Schema({
    /* The learner making the request. */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    /* The instructor's user account, not their profile — the profile can be
       unpublished or rebuilt, the account is the stable thing to point at. */
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    /* Optional. Only set when the booking came from an Enterprise listing,
       which is now just the `Other` category. */
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enterprise",
        default: null
    },
    bookingDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    /* createdAt → confirmedAt is what the Phase 2 response-time indicator is
       derived from, so it is recorded even though nothing reads it yet. */
    confirmedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

/* "My bookings" for a learner and "requests for me" for an instructor. */
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ instructorId: 1, createdAt: -1 });
/* The instructor dashboard's pending queue. */
bookingSchema.index({ instructorId: 1, status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

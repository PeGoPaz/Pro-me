import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    enterpriseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enterprise",
        required: true
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
    confirmedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

var mongoose = require("mongoose");

var appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },
  phone: { type: Number, required: true },
  slot: { type: Date, required: false, default: null },
  selectedSlot: {
    type: String,
    default: "",
  },

  disease: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
  activityStatus: { type: Boolean, default: true },
  isEmergency: { type: Boolean, default: false },
  review: {type: Number, default: 0, required: false}
});

module.exports = mongoose.model("Appointment", appointmentSchema);

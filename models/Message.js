const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, 
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, 
    },
    message: {
      type: String,
      required: true,
      trim: true, 
    },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" }, // New field

  },
  { timestamps: true } 
);

module.exports = mongoose.model("Message", MessageSchema);

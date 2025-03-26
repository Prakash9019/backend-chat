const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", },
    newMessage : [{
      text: {type : String},
      time: {type : String},
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Connection", ConnectionSchema);

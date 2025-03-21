import mongoose from "mongoose";

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
  },
  { timestamps: true } 
);

export default mongoose.model("Message", MessageSchema);

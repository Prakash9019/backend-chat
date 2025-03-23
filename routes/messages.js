import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const newMessage = new Message({ senderId, receiverId, message });

  try {
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:senderId/:receiverId", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.params.senderId, receiverId: req.params.receiverId },
        { senderId: req.params.receiverId, receiverId: req.params.senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

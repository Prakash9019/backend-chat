const express = require("express");
const  Message =require("../models/Message.js");

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

router.put("/status/:messageId", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.messageId,
      { status },
      { new: true }
    );

    // Get the io instance from the app
    const io = req.app.get('io');
    
    // Emit to both sender and receiver
    if (io) {
      io.to(updatedMessage.senderId.toString()).emit("messageStatusUpdated", {
        messageId: updatedMessage._id,
        status
      });
      
      io.to(updatedMessage.receiverId.toString()).emit("messageStatusUpdated", {
        messageId: updatedMessage._id,
        status
      });
    }

    res.status(200).json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

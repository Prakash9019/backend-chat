const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("../routes/auth.js");
const messageRoutes = require("../routes/messages.js");
const connectionRoutes = require("../routes/connections.js");
const userRoutes = require("../routes/users.js");
const Connection = require("../models/Connection.js");
const Message = require("../models/Message.js");

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, { 
  cors: { 
    origin: "http://localhost:5173",  
    methods: ["GET", "POST"],
    credentials: true
  } 
});


app.set('io', io);
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/users", userRoutes);
mongoose
  .connect(`mongodb+srv://plsprakash2003:Surya_2003@cluster0.bpe9m.mongodb.net/Cluster0?retryWrites=true&w=majority`)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.put("/api/messages/read", async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const result = await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
    io.to(senderId).emit("messagesReadUpdated", {
      senderId,
      receiverId,
      updated: result.modifiedCount, // Corrected field
    });
    res.json({ updated: result.modifiedCount });
    
  } catch (error) {
    console.error("Error updating read receipts:", error);
    res.status(500).json({ error: "Error updating read receipts" });
  }
});



io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ userId }) => {
        socket.join(userId);
        console.log(`User ${userId} joined their private room`);
    });

    socket.on("sendMessage", (message) => {
        console.log("Message received:", message);
        io.to(message.receiverId).emit("receiveMessage", message); // Send to receiver
    });

    socket.on("updateMessageStatus", ({ messageId, status }) => {
        io.emit("messageStatusUpdated", { messageId, status });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.get("/", (req, res) => {
  res.json("API is running");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
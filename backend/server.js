import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import connectionRoutes from "./routes/connections.js";
import userRoutes from "./routes/users.js";
import Connection from "./models/Connection.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/users", userRoutes);
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ userId }) => {
    socket.join(userId);
    console.log(`${userId} joined their personal chat room.`);
  });
  socket.on("sendRequest", ({ senderId, receiverId }) => {
    console.log(`Friend request sent from ${senderId} to ${receiverId}`);
    io.to(receiverId).emit("receiveRequest", { senderId });
  });
  socket.on("acceptRequest", ({ senderId, receiverId }) => {
    console.log(`Friend request accepted by ${receiverId}`);
    io.to(senderId).emit("requestAccepted", { receiverId });
  });

  socket.on("rejectRequest", ({ senderId, receiverId }) => {
    console.log(`Friend request rejected by ${receiverId}`);
    io.to(senderId).emit("requestRejected", { receiverId });
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      const connection = await Connection.findOne({
        $or: [
          { senderId, receiverId, status: "accepted" },
          { senderId: receiverId, receiverId: senderId, status: "accepted" },
        ],
      });

      if (connection) {
        const chatMessage = {
          senderId,
          receiverId,
          message,
          timestamp: new Date(),
        };

        io.to(receiverId).emit("receiveMessage", chatMessage);
        io.to(senderId).emit("receiveMessage", chatMessage);
      } else {
        console.log("Messaging blocked - No connection found");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.rooms.forEach((room) => socket.leave(room));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
export { io };

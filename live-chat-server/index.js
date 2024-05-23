
const express = require("express");
const dotenv = require("dotenv");
const { default: mongoose } = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

const userRoutes = require("./Routes/userRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);
    console.log("Server is Connected to Database");
  } catch (err) {
    console.log("Server is NOT connected to Database", err.message);
  }
};
connectDb();

app.get("/", (req, res) => {
  res.send("API is running123");
});

app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/message", messageRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

// Socket.io logic
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // Handle custom events here
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room ${room}`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left room ${room}`);
  });

  socket.on("sendMessage", (data) => {
    const { room, message } = data;
    io.to(room).emit("receiveMessage", message);
    console.log(`Message sent to room ${room}: ${message}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


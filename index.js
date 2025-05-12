const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomid: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomid, userid) => {
    console.log(`User connected: ${userid}, room: ${roomid}`);

    socket.join(roomid);

    socket.roomid = roomid;
    socket.userid = userid;

    socket.to(roomid).emit("user_connect", userid);
  });
  socket.on("send-message", ({ roomId, message }) => {
    socket.to(roomId).emit("chat-message", {
      userId: socket.userid || "Anonymous",
      message,
    });
  });

  socket.on("disconnect", () => {
    const roomid = socket.roomid;
    const userid = socket.userid;

    console.log(`User disconnected: ${userid || socket.id}`);

    if (roomid && userid) {
      socket.to(roomid).emit("user_disconnect", userid);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

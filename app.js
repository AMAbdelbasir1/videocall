const express = require("express");
const app = express();
const server = require("http").createServer(app);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("server connected");
  socket.on("join", ({ videoId, peerId }) => {
    socket.join(videoId);
    socket.to(videoId).emit("user-join", peerId);

    socket.on("disconnect", () => {
      socket.broadcast.to(videoId).emit("user-disconnected", peerId);
    });
  });
});

app.get("/video", (req, res) => {
  res.render("video", { videoId: "video-1122" });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`videocall app listening at ${3000}`);
});

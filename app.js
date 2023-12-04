const express = require("express");
const app = express();
const server = require("http").createServer(app);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("server connected");
  socket.on("join", (videoId) => {
    socket.join(videoId);
  });
  socket.on("videorequest", (videoId) => {
    socket.broadcast.to(videoId).emit("getPeerId");
  });
  socket.on("sendPeerId", (data) => {
    console.log("recived", data);
    socket.broadcast.to(data.videoId).emit("recivePeerId", data.peerId);
  });
  socket.on("newUserJoin", () => {
    io.emit("newUserJoin");
  });
});

app.get("/video", (req, res) => {
  res.render("video", { videoId: "video-1122" });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`videocall app listening at ${3000}`);
});

// const express = require("express");
// const app = express();
// const server = require("http").createServer(app);

// app.set("view engine", "ejs");
// app.use(express.static("public"));
// app.use(express.urlencoded({ extended: true }));

// const io = require("socket.io")(server);

// io.on("connection", (socket) => {
//   console.log("server connected");
//   socket.on("join", (vedioId) => {
//     socket.join(vedioId);
//   });
//   socket.on("videorequest", (vedioId) => {
//     socket.broadcast.to(vedioId).emit("getPeerId");
//   });
//   socket.on("sendPeerId", (data) => {
//     socket.broadcast.to(data.videoid).emit("recivePeerId", data.peerid);
//   });
//   socket.on("newUserJoin", () => {
//     io.emit("newUserJoin");
//   });
// });

// app.get("/video", (req, res) => {
//   res.render("video", { videoid: "video-1122" });
// });
// server.listen(process.env.PORT || 3000, () => {
//   console.log(`videocall app listening at ${3000}`);
// });

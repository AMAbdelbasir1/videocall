const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const videoContainer = document.getElementById("video-container");
const videoIdInput = document.getElementById("videoId");
const socket = io();
const peer = new Peer();
let peerId = null;
let localStream;
const peers = {};

function log(message) {
  console.log(message);
}

socket.on("connect", () => {
  log("Client connected");
});

peer.on("open", (id) => {
  log("My peer ID is: " + id);
  peerId = id;
});

function toggleMedia(trackType, enabled) {
  if (localStream && localStream[trackType]) {
    localStream[trackType]()[0].enabled = enabled;
  }
}

toggleAudioBtn.onclick = () => {
  toggleMedia("getAudioTracks", !localStream.getAudioTracks()[0].enabled);
};

toggleVideoBtn.onclick = () => {
  toggleMedia("getVideoTracks", !localStream.getVideoTracks()[0].enabled);
};

function shareVideo() {
  socket.emit("join", {
    videoId: videoIdInput.value,
    peerId: peerId,
  });

  const myVideo = document.createElement("video");
  myVideo.muted = true;
  const mediaConstraints = {
    video: true,
    audio: true,
  };

  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      log("entered video");
      peer.call(peerId, stream, { video: true, audio: true });
      addVideoStream(myVideo, stream);
      localStream = stream;
      peer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });
      socket.on("user-join", (userId) => {
        log("video" + userId);
        connectToNewUser(userId, stream);
      });
    })
    .catch((err) => {
      log(err);
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((audioStream) => {
          log("entered audio");
          peer.call(peerId, audioStream);
          addVideoStream(myVideo, audioStream);
          localStream = audioStream;
          peer.on("call", (call) => {
            call.answer(audioStream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
              addVideoStream(video, userVideoStream);
            });
          });
          socket.on("user-join", (userId) => {
            log("audio" + userId);
            connectToNewUser(userId, audioStream);
          });
        })
        .catch((err) => {
          log(err);
        });
    });
}

document.getElementById("shareVideoBtn").onclick = shareVideo;

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

const videoElements = [];

function addVideoStream(video, stream) {
  const existingVideo = videoElements.find(
    (element) => element.srcObject === stream,
  );
  if (!existingVideo) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    videoContainer.append(video);
    videoElements.push(video);
  }
}

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}

javascript: (function () {
  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/eruda";
  document.body.append(script);
  script.onload = function () {
    eruda.init();
  };
})();

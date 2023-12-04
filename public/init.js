const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const videoContainer = document.getElementById("video-container");
const videoId = document.getElementById("videoId").value;
const socket = io();
let peer = new Peer();
let peerId = null;
let localStream; // Store the local stream to toggle audio and video
const peers = {};
// Array to store the video elements created for each call

socket.on("connect", () => {
  console.log("client connected");
});

peer.on("open", (id) => {
  console.log("My peer ID is: " + id);
  peerId = id;
});

toggleAudioBtn.onclick = () => {
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
};

toggleVideoBtn.onclick = () => {
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
};

// Handle the button click to share your video
document.getElementById("shareVideoBtn").onclick = () => {
  // Emit the peer ID to the server for new user handling
  socket.emit("join", {
    videoId: videoId,
    peerId: peerId,
  });
  console.log("clicked");
  const myVideo = document.createElement("video");
  myVideo.muted = true;
  const mediaConstraints = {
    audio: true,
    video: { facingMode: "user" }, // Specify the user-facing camera
  };

  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      addVideoStream(myVideo, stream);
      peer.on("call", (call) => {
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });
      localStream = stream;
      socket.on("user-join", (userId) => {
        connectToNewUser(userId, stream);
      });
    })
    .catch((err) => {
      console.log(err);
      // If there's an error, try getting audio-only stream
      return navigator.mediaDevices.getUserMedia({ audio: true });
    })
    .then((audioStream) => {
      addVideoStream(myVideo, audioStream);
      peer.on("call", (call) => {
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });
      localStream = audioStream;
      socket.on("user-join", (userId) => {
        connectToNewUser(userId, stream);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoContainer.append(video);
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

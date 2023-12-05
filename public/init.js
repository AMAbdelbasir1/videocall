const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const videoContainer = document.getElementById("video-container");
const videoId = document.getElementById("videoId").value;
const socket = io();
var peer = new Peer();
var peerId = null;
var localStream; // Store the local stream to toggle audio and video
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
  if (localStream && localStream.getAudioTracks().length > 0) {
    const enabled = localStream.getAudioTracks()[0].enabled;
    if (enabled) {
      localStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      localStream.getAudioTracks()[0].enabled = true;
    }
  }
};

toggleVideoBtn.onclick = () => {
  if (localStream && localStream.getVideoTracks().length > 0) {
    let enabled = localStream.getVideoTracks()[0].enabled;
    if (enabled) {
      localStream.getVideoTracks()[0].enabled = false;
      setPlayVideo();
    } else {
      setStopVideo();
      localStream.getVideoTracks()[0].enabled = true;
    }
  }
};

const playStop = () => {};
// Handle the button click to share your video
document.getElementById("shareVideoBtn").onclick = () => {
  // Emit the peer ID to the server for new user handling
  socket.emit("join", {
    videoId: videoId,
    peerId: peerId,
  });
  // console.log("clicked");
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
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });
      localStream = stream;
      socket.on("user-join", (userId) => {
        console.log(userId);
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
        call.answer(audioStream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });
      localStream = audioStream;
      socket.on("user-join", (userId) => {
        console.log(userId);
        connectToNewUser(userId, audioStream);
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
  video.play();
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

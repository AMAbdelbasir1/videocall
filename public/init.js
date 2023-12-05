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
    console.log(enabled);
    if (enabled) {
      localStream.getAudioTracks()[0].enabled = false;
    } else {
      localStream.getAudioTracks()[0].enabled = true;
    }
  }
};

toggleVideoBtn.onclick = () => {
  if (localStream && localStream.getVideoTracks().length > 0) {
    let enabled = localStream.getVideoTracks()[0].enabled;
    console.log(enabled);
    if (enabled) {
      localStream.getVideoTracks()[0].enabled = false;
    } else {
      localStream.getVideoTracks()[0].enabled = true;
    }
  }
};

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
      // console.log(err);
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
        console.log("audio" + userId);
        connectToNewUser(userId, audioStream);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

socket.on("user-disconnected", (userId) => {
  console.log("peers ", peers);
  if (peers[userId]) peers[userId].close();
});
const videoElements = [];
function addVideoStream(video, stream) {
  let existingVideo = videoElements.find(
    (element) => element.srcObject === stream,
  );
  if (!existingVideo) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    videoElements.push(video);
    videoContainer.append(video);
  }
  console.log(videoElements);
}
function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
    delete peers[userId];
  });

  peers[userId] = call;
}

const callbtn = document.getElementById("callbtn");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const videoContainer = document.getElementById("video-container");
const vedioId = document.getElementById("vedioId").value;
const socket = io();
let peer = new Peer();
let peerId = null;

socket.on("connect", () => {
  console.log("client connected");
  socket.emit("join", vedioId);
});

peer.on("open", (id) => {
  console.log("My peer ID is: " + id);
  peerId = id;
});

callbtn.onclick = () => {
  socket.emit("videorequest", vedioId);
};

socket.on("getPeerId", () => {
  socket.emit("sendPeerId", {
    videoid: vedioId,
    peerid: peerId,
  });
});
let localStream; // Store the local stream to toggle audio and video

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
socket.on("recivePeerId", (id) => {
  console.log("peer id user 2 " + id);
  // Check if the user has a camera
  const mediaConstraints = {
    audio: true,
    video: { facingMode: "user" }, // Specify the user-facing camera
  };

  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      localStream = stream;
      let call = peer.call(id, stream);
      call.on("stream", showVideo);
    })
    .catch((err) => {
      console.log(err);
      // If there's an error, try getting audio-only stream
      return navigator.mediaDevices.getUserMedia({ audio: true });
    })
    .then((audioStream) => {
      localStream = audioStream;
      let call = peer.call(id, audioStream);
      call.on("stream", showVideo);
    })
    .catch((err) => {
      console.log(err);
    });
});

peer.on("call", (call) => {
  // Answer the call, providing our mediaStream
  const mediaConstraints = {
    audio: true,
    video: { facingMode: "user" }, // Specify the user-facing camera
  };

  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      localStream = stream;
      call.answer(stream);
      call.on("stream", showVideo);
    })
    .catch((err) => {
      console.log(err);
      // If there's an error, answer with audio-only stream
      return navigator.mediaDevices.getUserMedia({ audio: true });
    })
    .then((audioStream) => {
      localStream = audioStream;
      call.answer(audioStream);
      call.on("stream", showVideo);
    })
    .catch((err) => {
      console.log(err);
    });
});

const videoElements = [];

function showVideo(stream) {
  // Check if a video element already exists for this stream
  let existingVideo = videoElements.find(
    (element) => element.srcObject === stream,
  );

  if (!existingVideo) {
    // If not, create a new video element
    let video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.playsinline = true;
    video.muted = false; // Set to true if you want to mute the local user's video
    videoElements.push(video);

    // Append the video element to the video container
    videoContainer.appendChild(video);
  }
  callbtn.remove();
}

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

let isCameraOn = true;
let isMicOn = true;
let myStream;
let mediaStreamConstraints = {
  video: true,
  audio: true,
};

const peer = new Peer(undefined, {
  host: "localhost",
  port: 3001,
  path: "/",
});

navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then((stream) => {
  myStream = stream;
  addVideoStream(myVideo, stream);

  peer.on("call", (call) => {
    call.answer(stream);
    console.log("calling here");

    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      console.log("getting call stream", call.peer);

      addVideoStream(video, userVideoStream);
    });
  });

  socket.on("user_connect", (userId) => {
    connectToNewUser(userId, stream);
  });
});

peer.on("open", (id) => {
  console.log(ROOM_ID);
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadeddata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function toggleCamera() {
  isCameraOn = !isCameraOn;
  if (isCameraOn) {
    mediaStreamConstraints.video = true;
  } else {
    mediaStreamConstraints.video = false;
  }

  updateStream();
  updateToggleState();
}

function toggleMic() {
  isMicOn = !isMicOn;
  if (isMicOn) {
    mediaStreamConstraints.audio = true;
  } else {
    mediaStreamConstraints.audio = false;
  }

  updateStream();
  updateToggleState();
}

function updateStream() {
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then((stream) => {
    myStream.getTracks().forEach((track) => track.stop());
    myStream = stream;
    addVideoStream(myVideo, stream);
  });
}

function updateToggleState() {
  document.getElementById("camera-img").src = isCameraOn
    ? "/camera_on.png"
    : "/camera_off.png";
  document.getElementById("mic-img").src = isMicOn
    ? "/mic_on.png"
    : "/mic_off.png";
}

function toggleCamera() {
  isCameraOn = !isCameraOn;
  updateToggleState();
  if (isCameraOn) {
    mediaStreamConstraints.video = true;
  } else {
    mediaStreamConstraints.video = false;
  }
  updateStream();
}

function toggleMic() {
  isMicOn = !isMicOn;
  updateToggleState();
  if (isMicOn) {
    mediaStreamConstraints.audio = true;
  } else {
    mediaStreamConstraints.audio = false;
  }
  updateStream();
}

function updateStream() {
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then((stream) => {
    myStream.getTracks().forEach((track) => track.stop());
    myStream = stream;
    addVideoStream(myVideo, stream);
  });
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (message === "") return;

  socket.emit("send-message", { roomId: ROOM_ID, message });
  appendMessage("You", message);
  input.value = "";
}

function appendMessage(sender, message) {
  const msgBox = document.getElementById("messages");
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${message}`;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

socket.on("chat-message", ({ userId, message }) => {
  appendMessage(userId, message);
});

function endcall() {
  window.close();
  console.log("end button clicked");
}

window.onload = function () {
  updateToggleState();
};

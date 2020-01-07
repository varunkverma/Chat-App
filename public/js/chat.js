const socket = io();

// Elements
const msgBtn = document.getElementById("msgBtn");
const msgInput = document.getElementById("msgIn");
const sendLocationButton = document.getElementById("send-location");
const messages = document.getElementById("messages");
const msgForm = document.getElementById("message_form");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Query Options from the URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

// auto scrolling
const autoScroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;

  //Height of the new message = mergin+padding
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages constainer
  const containerHeight = messages.scrollHeight;

  // How far have i scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;

  // checking if user was at the bottom, when a new message arrived
  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

const sendMsg = e => {
  // disable input form button
  msgBtn.setAttribute("disabled", "disabled");
  if (msgInput.value) {
    socket.emit("sendMessage", msgInput.value, error => {
      // enabling the input form button
      msgBtn.removeAttribute("disabled");
      // clearing the conent in input field
      msgInput.value = "";
      msgInput.focus();
      if (error) {
        return console.log(error);
      }

      console.log("Message delivered");
      autoScroll();
    });
  } else {
    alert("Please enter some text");
    msgBtn.removeAttribute("disabled");
  }
  e.preventDefault();
};

// client listening on "message" event to render normal text messages
socket.on("message", message => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  // appending the message template html at theend of the messages div
  messages.insertAdjacentHTML("beforeend", html);
});

// client listening on "locationMessage" event to render location of the user
socket.on("locationMessage", location => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm a")
  });
  // appending the location template html at theend of the messages div
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

msgBtn.addEventListener("click", sendMsg);

sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("GeoLocation not supported by your browser");
  }

  // disabling the send location button
  sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    //enabling the send button

    sendLocationButton.removeAttribute("disabled");
    const longitude = position.coords.longitude;
    const latitude = position.coords.latitude;
    socket.emit("sendLocation", { longitude, latitude }, ackMessage => {
      console.log(ackMessage);
    });
  });
});

// event to emit info to server about the username and room details
socket.emit("join", { username, room }, error => {
  // error acknowladgement
  if (error) {
    alert(error);
    location.href = "/";
  }
});

// Listening on event "roomData" to get latest users in room
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.getElementById("sidebar").innerHTML = html;
});

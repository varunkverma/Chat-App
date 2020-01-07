const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "..", "public");

// serve up public elements
app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  console.log("New web socket connection");

  // server listening on the event "join"
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    // create a room and join it
    socket.join(user.room);

    // emiting greeting message fromserver to new clients within the room
    socket.emit("message", generateMessage("Admin", "Welcome to the chat app"));

    // broadcast info of a new user joining the group in the room
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined the conversion`)
      );

    // event to emit the users to the client every time a user joins the room
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("Error, user not found");
    }
    // sending recieved task to everyone
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity not allowed");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  // server listening for event 'sendLocation
  socket.on("sendLocation", ({ longitude, latitude }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("Error, user not found");
    }
    // sharing coordinates to all the members on an event called locationMessage
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );
    callback();
  });

  // if a user leaves, letting all other users know this
  socket.on("disconnect", () => {
    const user = removeUser(socket.io);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `A ${user.username} has left`)
      );
      // event to emit the users to the client every time a user leaves the room
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up at: ${port}`);
});

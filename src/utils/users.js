// This file provides the necssary functions that will help to manage users
const users = [];

// addUser, removeUser, getUser, getUserInRoom

const addUser = ({ id, username, room }) => {
  // Clean the data
  if (!username || !room) {
    return {
      error: "Username and room are required!"
    };
  }
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: "Username and room are required!"
    };
  }

  //Check for existing user in a room
  const existingUser = users.find(user => {
    return user.username === username && user.room === room;
  });

  // Validate username
  if (existingUser) {
    return { error: "Username is in use! Please us a different name" };
  }

  // Store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// Remove a user using id
const removeUser = id => {
  let userIndex = users.findIndex(user => user.id === id);
  if (userIndex !== 0) {
    return users.splice(userIndex, 1)[0];
  }
};

// Get user using id
const getUser = id => {
  let user = users.find(user => user.id === id);
  return user;
};

// getUsersInRoom
const getUsersInRoom = room => {
  room = room.trim().toLowerCase();
  let usersInRoom = users.filter(user => user.room === room);
  return usersInRoom;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};

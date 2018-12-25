var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
const PORT = 4200;

http.listen(PORT, err => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server listen on port ${PORT}`);
  }
});

function getRoom(roomID) {
  return io.sockets.adapter.rooms[roomID];
}

function getAllRooms() {
  return io.sockets.adapter.rooms;
}

function leaveAllUserInRoom(roomID) {
  let room = getRoom(roomID);

  console.log("disconnect on room", room);

  // leave all user in room
  if (typeof room !== undefined) {
    room.users.forEach(user => {
      console.log("and user is", user);
      let socketId = user.socketID;
      io.sockets.sockets[socketId].leave(roomID);
      if (user) {
      }
    });
  }
}

function updateUsersInRoom(roomID) {
  let allUserInRoom = getRoom(roomID).users;

  io.to(roomID).emit("update users in room", {
    users: allUserInRoom
  });
}

function updateStatusUserToRoom(users, socketID, roomID) {
  let room = getRoom(roomID);
  let userUpdate = users[socketID];
  let findIndexUser = room.users.map(user => user.socketID).indexOf(socketID);
  console.log("update status user to room", userUpdate, findIndexUser);
  room.users[findIndexUser] = { ...userUpdate };
  console.log(room);
}

let users = {};

io.on("connection", socket => {
  console.log("connected");

  users[socket.id] = {
    username: null,
    roomID: null,
    socketID: socket.id,
    isCreator: false,
    isReady: false,
    inRoom: false,
    inGame: false
  };

  socket.emit("first connect", {
    socketID: socket.id
  });

  socket.on("reply connect", data => {
    users[data.socketID].username = data.username;
    console.log(users);
  });

  // on creat room
  socket.on("create room", data => {
    console.log("create room", data);
    const { socketID, roomID } = data;

    if (users[socketID]) {
      users[socketID].isCreator = true;
      users[socketID].roomID = roomID;
      users[socketID].inRoom = true;
      users[socketID].isReady = true;

      console.log("users", users);

      socket.join(roomID);

      let room = getRoom(roomID);
      room.roomID = roomID;
      room.users = [];
      room.users.push(users[socket.id]);

      updateUsersInRoom(roomID);

      console.log("room is", room);
    }
  });

  // on creator leave room
  socket.on("creator leave room", ({ roomID }) => {
    console.log("creator leave room");
    let room = getRoom(roomID);
    io.to(roomID).emit("reply creator leave room");

    // leave all user in room
    leaveAllUserInRoom(roomID);
  });

  socket.on("find room", ({ roomValue, socketID }) => {
    console.log("searching room", roomValue);
    if (getRoom(roomValue)) {
      console.log("room found");
      let room = getRoom(roomValue);

      socket.emit("room found", {
        roomID: roomValue
      });
      socket.join(roomValue);

      users[socketID].inRoom = true;
      users[socketID].roomID = roomValue;
      room.users.push(users[socketID]);

      updateUsersInRoom(roomValue);

      console.log("room after find room", room);
    } else {
      console.log("room not found");
      socket.emit("room not found");
    }
  });

  socket.on("connect", function(data) {
    console.log(data);
  });

  socket.on("user leave room", ({ roomID, socketID }) => {
    let userLeave = users[socketID];
    let room = getRoom(roomID);

    if (room) {
      // remove user in room
      let findIndesUserLeave = room.users
        .map(user => user.socketID)
        .indexOf(socketID);
      room.users.splice(findIndesUserLeave, 1);
      userLeave.inRoom = false;
      userLeave.roomID = null;

      socket.leave(roomID);
      updateUsersInRoom(roomID);
      console.log("user leave", userLeave.username);
      console.log("user leave index", findIndesUserLeave);
      console.log("room after user leave", room);
    }
  });

  socket.on("user ready", ({ roomID, socketID }) => {
    let userReady = users[socketID];
    console.log(userReady.username, "is ready in room", userReady.roomID);
    userReady.isReady = true;
    updateStatusUserToRoom(users, socketID, roomID);
    updateUsersInRoom(roomID);
  });

  socket.on("disconnect", async () => {
    console.log("disconnect", users[socket.id]);

    // if creator in room but disconnect
    if (users[socket.id].isCreator && users[socket.id].inRoom) {
      let user = users[socket.id].username;
      let roomID = users[socket.id].roomID;
      io.to(roomID).emit("creator disconnect");
      let room = getRoom(roomID);
      room.users.forEach(user => {
        if (!user.isCreator) {
          let socketId = user.socketID;
          users[socketId].inRoom = false;
          users[socketId].roomID = null;
          io.sockets.sockets[socketId].leave(roomID);
        }
      });
    }
    delete users[socket.id];
  });
});

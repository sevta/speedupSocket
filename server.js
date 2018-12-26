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

function leaveAllUserInRoom(users, roomID) {
  let room = getRoom(roomID);

  console.log("disconnect on room", room);

  // leave all user in room
  if (room) {
    room.users.forEach(user => {
      console.log("and user is", user);
      let socketId = user.socketID;
      io.sockets.sockets[socketId].leave(roomID);
      // reset status user in room
      users[user.socketID].isReady = false;
      users[user.socketID].isCreator = false;
      users[user.socketID].inRoom = false;
      users[user.socketID].inGame = false;
      users[user.socketID].roomID = null;
      console.log("user leave", user);
    });
  }
}

function updateUsersInRoom(roomID) {
  let allUserInRoom = getRoom(roomID).users;

  io.to(roomID).emit("update users in room", {
    users: allUserInRoom
  });

  // find all user status ready in room
  let filterUserReady = allUserInRoom.filter(val => val.isReady);
  console.log("check user in room is ready or not", filterUserReady);
  // find creator room in all user status ready
  let creatorRoom = filterUserReady.filter(val => val.isCreator);
  // if user ready has 4 people tell to creator game is ready to play
  if (filterUserReady.length == 2) {
    console.log("send to creator game is ready", creatorRoom);
    // emit to creator game is ready to play
    io.to(creatorRoom[0].socketID).emit("game is ready");
  } else {
    // emit to creator game game not ready
    console.log("game not ready , waiting for other player...", creatorRoom);
    io.to(creatorRoom[0].socketID).emit("game not ready");
  }
}

// replace current status user to user array in socket room
function updateStatusUserToRoom(users, socketID, roomID) {
  let room = getRoom(roomID);
  let userUpdate = users[socketID];
  let findIndexUser = room.users.map(user => user.socketID).indexOf(socketID);
  console.log("update status user to room", userUpdate, findIndexUser);
  room.users[findIndexUser] = { ...userUpdate };
}

let users = {};

io.on("connection", socket => {
  console.log("connected");

  // initial user state
  users[socket.id] = {
    username: null,
    roomID: null,
    socketID: socket.id,
    isCreator: false,
    isReady: false,
    inRoom: false,
    inGame: false
  };

  // first connect send to client his socket id
  socket.emit("first connect", {
    socketID: socket.id
  });

  // reply in first connect from client and keep important data from client to users state
  socket.on("reply connect", data => {
    users[data.socketID].username = data.username;
    console.log(users);
  });

  // on create room
  socket.on("create room", ({ socketID, roomID }) => {
    console.log(socketID, "create room ", roomID);
    if (users[socketID]) {
      // update user status
      users[socketID].isCreator = true;
      users[socketID].roomID = roomID;
      users[socketID].inRoom = true;
      users[socketID].isReady = true;
      socket.join(roomID);

      console.log("users on create room", users);

      let room = getRoom(roomID);

      // give room id to socket room
      room.roomID = roomID;

      // initalize user in room
      room.users = [];
      room.users.push(users[socket.id]);

      // then update user and emit to client
      updateUsersInRoom(roomID);
      console.log("room is", room);
    }
  });

  // on creator leave room
  socket.on("creator leave room", ({ roomID }) => {
    console.log("creator leave room");
    io.to(roomID).emit("reply creator leave room");

    // leave all user in room && reset user to default value
    leaveAllUserInRoom(users, roomID);
  });

  socket.on("find room", ({ roomValue, socketID }) => {
    console.log("searching room", roomValue);

    // if room found
    if (getRoom(roomValue)) {
      console.log("room found");
      let room = getRoom(roomValue);
      // send to client room is found
      socket.emit("room found", {
        roomID: roomValue
      });
      socket.join(roomValue);

      // update user status && update the room
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

  // on user leave room
  socket.on("user leave room", ({ roomID, socketID }) => {
    let userLeave = users[socketID];
    let room = getRoom(roomID);

    if (room) {
      // find index user in room && remove user in room
      let findIndesUserLeave = room.users
        .map(user => user.socketID)
        .indexOf(socketID);
      room.users.splice(findIndesUserLeave, 1);
      // reset user leave to default value
      userLeave.inRoom = false;
      userLeave.roomID = null;
      userLeave.isReady = false;
      socket.leave(roomID);

      // update user and emit to client
      updateUsersInRoom(roomID);

      console.log("user leave", userLeave.username);
      console.log("user leave index", findIndesUserLeave);
      console.log("room after user leave", room);
    }
  });

  // on user is ready to play
  socket.on("user ready", ({ roomID, socketID }) => {
    let userReady = users[socketID];
    console.log(userReady.username, "is ready in room", userReady.roomID);
    userReady.isReady = true;
    updateStatusUserToRoom(users, socketID, roomID);
    updateUsersInRoom(roomID);
  });

  socket.on("creator start to game", ({ roomID }) => {
    io.to(roomID).emit("start game");
  });

  // in first game loaded update current status user his in game & send to room
  socket.on("in game", ({ socketID, roomID }) => {
    let user = users[socketID];
    user.inGame = true;
    updateStatusUserToRoom(users, socketID, roomID);
    updateUsersInRoom(roomID);
  });

  socket.on("disconnect", async () => {
    console.log("disconnect", users[socket.id]);
    let user = users[socket.id];
    // if creator in room but disconnect leave all user in room &&
    // reset all user in room to default value
    if (users[socket.id].isCreator && users[socket.id].inRoom) {
      let roomID = users[socket.id].roomID;
      io.to(roomID).emit("creator disconnect", user.username);
      let room = getRoom(roomID);

      // find all user in room &&
      // reset defeault value except creator room because his disconnect and
      // his user object has deleted :(
      room.users.map(user => {
        if (!user.isCreator) {
          let socketId = user.socketID;
          users[socketId].inRoom = false;
          users[socketId].roomID = null;
          users[socketId].inGame = false;
          users[socketId].isReady = null;
          users[socketId].isCreator = false;
          io.sockets.sockets[socketId].leave(roomID);
        }
      });
    }

    // if user in game but disconnect or left
    if (users[socket.id].inGame) {
      console.log("in game but im disconnect", user.username);
      let roomID = user.roomID;
      let room = getRoom(roomID);
      let allUserInRoom = room.users;

      // tell to room his leave us  :(
      io.to(roomID).emit("user left game", {
        user: user.username
      });

      // get index user left & remove from room
      let findIndexUserLeftGame = room.users
        .map(userInRoom => userInRoom.socketID)
        .indexOf(socket.id);
      allUserInRoom.splice(findIndexUserLeftGame, 1);
      console.log("he is left game", findIndexUserLeftGame, user.username);

      io.to(roomID).emit("update users in room", {
        users: allUserInRoom
      });
    }

    // delete disconnected users
    delete users[socket.id];
  });
});

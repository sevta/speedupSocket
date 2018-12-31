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

class User {
  constructor(props) {
    this.username = props.username;
    this.socketID = props.socketID;
    this.isCreator = false;
    this.isCreator = false;
    this.roomID = null;
    this.isReady = false;
    this.inRoom = false;
    this.inGame = false;
  }

  setState(newState) {
    console.log("im currently set new state", newState, this);
  }

  resetValue() {
    this.inRoom = false;
    this.roomID = null;
    this.isReady = false;
    this.inGame = false;
    this.isCreator = false;
  }
}

class Room {
  constructor(props) {
    this.roomID = props.roomID;
    this.users = [];
    this.roomInGame = false;
    this.interValRoomTimer = null;
    this.interValGameTiemr = null;
    this.roomTimer = 15;
    this.gameTimer = 30;
  }

  updateStatusUserInRoom(users, socketID) {
    let userUpdate = users[socketID];
    let findIndexUser = this.users.map(user => user.socketID).indexOf(socketID);
    console.log("update status user to room", userUpdate, findIndexUser);
    this.users[findIndexUser] = { ...userUpdate };
    console.log("updated user in class", this.users);
  }

  pushUserToRoom(user) {
    this.users.push(user);
    // console.log("user in room class", this.users);
    this.users.map(user => console.log("user in room", user));
  }

  checkCanStartGame() {
    // find all user status ready in room
    let filterUserReady = this.users.filter(val => val.isReady);
    console.log("how many user ready in room", filterUserReady.length);
    // find creator room in all user status ready
    let creatorRoom = filterUserReady.filter(val => val.isCreator);
    // if user ready has 4 people tell to creator game is ready to play
    if (filterUserReady.length >= 2 && filterUserReady.length >= 3) {
      console.log("send to creator game is ready", creatorRoom);
      // emit to creator game is ready to play
      io.to(creatorRoom[0].socketID).emit("game is ready");
    } else {
      // emit to creator game game not ready
      console.log("game not ready , waiting for other player...", creatorRoom);
      io.to(creatorRoom[0].socketID).emit("game not ready");
    }
  }

  removeUserInRoom(socketID) {
    let findIndesUserLeave = this.users
      .map(user => user.socketID)
      .indexOf(socketID);
    this.users.splice(findIndesUserLeave, 1);
  }

  leaveAllUserInRoom(users) {
    // console.log("disconnect on room", room);
    this.users.map(({ socketID }) => {
      // leave all user in socket room
      io.sockets.sockets[socketID].leave(this.roomID);
      // reset status user in room
      users[socketID].isReady = false;
      users[socketID].isCreator = false;
      users[socketID].inRoom = false;
      users[socketID].inGame = false;
      users[socketID].roomID = null;
    });

    let filterUserLeave = this.users.map(({ socketID }) => users[socketID]);
    console.log("check user leave", filterUserLeave);
  }

  emitUpdatedUserInRoom() {
    io.to(this.roomID).emit("update users in room", {
      users: this.users
    });
  }

  startTimerRoom() {
    this.interValRoomTimer = setInterval(() => {
      this.roomTimer--;
      if (this.roomTimer <= 0) {
        this.roomTimer = 0;
        this.stopTimerRoom();
      }
      io.to(this.roomID).emit("start room timer", {
        roomTimer: this.roomTimer
      });
      // console.log("room timer in", this.roomID, this.roomTimer);
    }, 1000);
  }

  stopTimerRoom() {
    console.log("stop timer");
    clearInterval(this.interValRoomTimer);
    io.to(this.roomID).emit("room timer done", {
      roomTimer: this.roomTimer
    });
    // send to creator room timer is done
    // let creator = this.users.filter(val => val.isCreator);
    // console.log("room timer done", this.users, creator[0]);
    // io.to(creator[0].socketID).emit("creator stop timer room");
  }

  startTimerGame() {
    console.log("game timer start");
  }
}

let users = {};
let rooms = {};

io.on("connection", socket => {
  // initial user state
  users[socket.id] = new User({
    socketID: socket.id
  });

  const find = {
    user(socketID) {
      return users[socketID];
    },
    room(roomID) {
      return rooms[roomID];
    }
  };

  // first connect send to client his socket id
  socket.emit("first connect", {
    socketID: socket.id
  });

  // reply in first connect from client and keep important data from client to users state
  socket.on("reply connect", ({ socketID, username }) => {
    let user = find.user(socketID);
    user.username = username;
    console.log("reply first connect", username, socketID);
  });

  // on create room
  socket.on("create room", ({ socketID, roomID }) => {
    let user = find.user(socketID);
    if (user) {
      // update user status
      user.isCreator = true;
      user.roomID = roomID;
      user.inRoom = true;
      user.isReady = true;
      socket.join(roomID);
      // create new room
      rooms[roomID] = new Room({
        roomID
      });
      // find room and update
      let room = find.room(roomID);
      room.pushUserToRoom(users[socketID]);
      room.emitUpdatedUserInRoom();
      room.checkCanStartGame();
      room.startTimerRoom();
    }
  });

  // on creator leave room
  socket.on("creator leave room", ({ roomID }) => {
    io.to(roomID).emit("reply creator leave room");
    let room = find.room(roomID);
    // leave all user in room && reset user to default value
    if (room) {
      room.leaveAllUserInRoom(users);
      room.stopTimerRoom();
      delete rooms[roomID];
    }
  });

  socket.on("find room", ({ roomValue, socketID }) => {
    console.log("searching room", roomValue);
    let room = find.room(roomValue);
    let user = find.user(socketID);
    // if room found
    if (room) {
      if (room.users.length == 3) {
        // send to client room fulll
        socket.emit("room full");
        console.log("room full");
      } else {
        // send to client room is found
        console.log("room found");
        socket.emit("room found", {
          roomID: roomValue
        });
        socket.join(roomValue);
        // update user status && update the room
        user.inRoom = true;
        user.roomID = roomValue;
        room.pushUserToRoom(user);
        room.checkCanStartGame();
        room.emitUpdatedUserInRoom();
        console.log("room after find room", room);
        // console.log("room socket after find room", getRoom(user.roomID));
      }
    } else {
      console.log("room not found");
      socket.emit("room not found");
    }
  });

  // on user leave room
  socket.on("user leave room", ({ roomID, socketID }) => {
    let user = find.user(socketID);
    let room = find.room(roomID);
    // if room found
    if (room) {
      // find index user in room && remove user in room
      // update user and emit to client
      room.removeUserInRoom(socketID);
      user.resetValue();
      room.emitUpdatedUserInRoom();
      socket.leave(roomID);
    }
  });

  // on user is ready to play
  socket.on("user ready", ({ roomID, socketID }) => {
    let user = find.user(socketID);
    let room = find.room(roomID);
    console.log(user.username, "is ready in room", user.roomID);
    user.isReady = true;
    room.updateStatusUserInRoom(users, socketID);
    room.checkCanStartGame();
    room.emitUpdatedUserInRoom();
  });

  socket.on("creator start to game", ({ roomID }) => {
    io.to(roomID).emit("start game");
  });

  // socket.on("reply creator stop timer room", ({ roomID }) => {
  //   console.log("stop timer room in", roomID);
  //   console.log("room before room timer done");
  //   // if room timer done , delete room from creator room
  //   let room = find.room(roomID);
  //   console.log("reply creator stop timer room");
  //   // room.leaveAllUserInRoom(users);
  //   // room.updateStatusUserInRoom(users, roomID);
  //   // room.emitUpdatedUserInRoom();
  //   delete rooms[roomID];
  //   // console.log("room after room timer done", room, getRoom(roomID));
  //   // console.log("users after room done", users);
  // });

  socket.on("reset user in timer done", ({ socketID }) => {
    let user = find.user(socketID);
    if (!user.inGame) {
      if (user.isCreator) {
        console.log("saya creator dan mau hapus room", user);
        // todo
        // send to creator room is done
        // stop timer
        io.to(user.socketID).emit("creator stop timer room");
        // let room = find.room(user.roomID)
        delete rooms[user.roomID];

        user.resetValue();
      } else {
        user.resetValue();
      }
      console.log("room after reset user timer done creator", rooms);
      console.log("users after reset user timer in room", users);
    }
  });

  // in first game loaded update current status user his in game & send to room
  socket.on("in game", ({ socketID, roomID }) => {
    let user = find.user(socketID);
    let room = find.room(roomID);
    user.inGame = true;
    room.updateStatusUserInRoom(users, socketID);
    room.stopTimerRoom();
    room.startTimerGame();
    room.emitUpdatedUserInRoom();
  });

  socket.on("disconnect", async () => {
    console.log("disconnect", users[socket.id]);
    let user = find.user(socket.id);

    // if user disconnect in lobby and not the creator
    if (user.inRoom && !user.isCreator && !user.inGame) {
      let room = find.room(user.roomID);
      console.log("im in room but disconnect", user.username, "in room", room);
      room.removeUserInRoom(user.socketID);
      socket.leave(user.roomID);
      room.emitUpdatedUserInRoom();
      console.log("room now is", room);
      console.log("socket room now", getRoom(user.roomID));
    }

    // if creator in room but disconnect leave all user in room &&
    // reset all user in room to default value
    if (user.isCreator && user.inRoom && !user.inGame) {
      let roomID = users[socket.id].roomID;
      console.log("creator disconnect", user.username);
      io.to(roomID).emit("creator disconnect", user.username);
      let room = find.room(roomID);
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
      room.stopTimerRoom();
      delete rooms[roomID];
    }

    // if user in game but disconnect or left
    if (user.inGame) {
      console.log("in game but im disconnect", user.username);
      let roomID = user.roomID;
      let socketID = user.socketID;
      let room = find.room(roomID);
      // if she alone in game but disconnect
      // delete room object
      console.log("room now", getRoom(roomID), room);
      if (room.users.length == 1) {
        console.log("im alone but disconnect please delete room");
        console.log("room now", getRoom(roomID));
        delete rooms[roomID];
        socket.leave(roomID);
        console.log("room now", getRoom(roomID));
      } else {
        // tell to room his leave us  :(
        io.to(roomID).emit("user left game", {
          user: user.username
        });
        // get index user left & remove from room
        room.removeUserInRoom(socketID);
        room.emitUpdatedUserInRoom();
        console.log("room now", room, getRoom(roomID));
      }
    }
    // delete disconnected users
    delete users[socket.id];
  });
});

import $ from "jquery";
import io from "socket.io-client";
import faker from "faker";

let socket = io.connect("http://localhost:4200");

class Room {
  constructor(props) {
    this.data = {
      username: faker.name.findName(),
      socketID: null,
      roomID: null,
      isCreator: false,
      isCreatorRoom: false,
      inRoom: false,
      inGame: false,
      roomFound: false,
      usersInRoom: [...Array(4).fill("waiting")]
    };
    this.data = Object.assign({}, this.data, props);
  }

  handleEvents() {
    let roomValue = "";

    $(".btn-create").on("click", () => {
      $(".speedup-popup").fadeIn("");
      this.createRoom();
    });

    $(".speedup-popup").on("click", () => {
      $(".speedup-popup").fadeOut("");
      this.closePopupRoom();
    });

    $(".inner-speedup-popup").on("click", function(e) {
      e.stopPropagation();
    });

    $(".btn-join").on("click", () => {
      $(".input-room-code").fadeToggle();
    });

    $(".speedup-inputroomcode-form").on("submit", e => {
      e.preventDefault();
      this.submitRoomCode(roomValue);
    });

    $(".input-room-code").on("input", e => {
      let value = e.target.value;
      console.log(value);
      roomValue = value;
    });
  }

  setData(newData, cb) {
    let prev = this.data;
    console.log("setdata", this.data);
    this.data = { ...this.data, ...newData };
    if (cb) {
      cb(prev);
    }
  }

  init() {
    $(".speedup-popup").hide();
    $(".input-room-code").hide();
    this.handleSocket();
    this.handleEvents();
    console.log("init room", this.data);
  }

  handleSocket() {
    socket.on("first connect", data => {
      console.log(data);
      this.setData({ socketID: data.socketID }, () => {
        console.log("set data", this.data);
        socket.emit("reply connect", {
          username: this.data.username,
          socketID: this.data.socketID
        });
        console.log(this.data);
      });
    });

    socket.on("room found", ({ roomID }) => {
      console.log("room found", roomID);
      this.setData({ roomFound: true, roomID: roomID }, () => {
        $(".speedup-popup").fadeIn();
        $(".room-code").text(this.data.roomID);
      });
    });

    socket.on("reply creator leave room", () => {
      console.log("socket leave room");
      this.setData({ roomID: null }, () => {
        $(".speedup-popup").fadeOut();
      });
    });

    socket.on("creator disconnect", () => {
      console.log("creator disconnect");
      this.setData({ roomID: null }, () => {
        $(".speedup-popup").fadeOut();
      });
    });

    socket.on("update users in room", ({ users }) => {
      console.log("user in room", users);

      this.data.usersInRoom = [
        ...users,
        ...Array(this.data.usersInRoom.length - users.length).fill("waiting...")
      ];

      $(".user-list-container").html(`
        ${this.data.usersInRoom
          .map(
            user => `
            <div class="user-list">${user.username || "waiting"} ${
              user.isReady ? "ready" : ""
            }</div>
            `
          )
          .join("")} 
          <button class="btn-start bg-teal text-white py-2 px-4">
            start game
          </button>
          <button class="btn-ready bg-red text-white py-2 px-4">
            ready
          </button>
      `);
      if (!this.data.isCreatorRoom) {
        $(".btn-start").remove();
        $(".btn-ready").show();
      } else {
        $(".btn-start").show();
        $(".btn-ready").remove();
      }

      this.data.usersInRoom.map(user => {
        if (user.isReady && user.socketID == this.data.socketID) {
          console.log("im ready");
          $(".btn-ready")
            .attr("disabled", true)
            .css({
              opacity: 0.3,
              cursor: "not-allowed"
            });
        }
      });

      $(".btn-start").on("click", () => console.log("start game"));
      $(".btn-ready").on("click", () => {
        socket.emit("user ready", {
          roomID: this.data.roomID,
          socketID: this.data.socketID
        });
      });
    });
  }

  createRoom() {
    console.log("create room");
    this.setData({ roomID: faker.random.number(), isCreatorRoom: true }, () => {
      console.log(this.data);
      $(".room-code").text(this.data.roomID);
      socket.emit("create room", {
        roomID: this.data.roomID,
        socketID: this.data.socketID,
        creatorRoom: this.data.username
      });
    });
  }

  closePopupRoom() {
    console.log("close popup room");
    const { isCreatorRoom } = this.data;
    if (isCreatorRoom) {
      console.log("creator leave room");
      this.setData({ isCreatorRoom: false }, () => {
        socket.emit("creator leave room", {
          roomID: this.data.roomID
        });
      });
    } else {
      console.log("user leave room", this.data.roomID);
      this.setData({ roomFound: false });
      socket.emit("user leave room", {
        roomID: this.data.roomID,
        socketID: this.data.socketID
      });
    }
  }

  submitRoomCode(value) {
    console.log("submit", value);
    socket.emit("find room", {
      socketID: this.data.socketID,
      roomValue: value
    });
  }
}

class Game extends Room {
  constructor() {
    super();
    console.log(this);
  }

  handleGameSocket() {
    console.log("game socket");
  }

  init() {
    super.init();
    this.handleGameSocket();
  }
}

// let speedup = new Speedup();
let game = new Game();
game.init();
// speedup.init();

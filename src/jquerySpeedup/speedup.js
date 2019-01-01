import $ from "jquery";
import io from "socket.io-client";
import faker from "faker";

$(document).ready(function() {
  let socket = io.connect("http://localhost:4200");

  class Room {
    constructor(props) {
      this.data = {
        username: faker.name.findName(),
        socketID: null,
        roomID: null,
        isCreatorRoom: false,
        inRoom: false,
        inGame: false,
        roomFound: false,
        isUserReady: false,
        isGameReady: false,
        debug: true,
        quotes: "tesi makan ayam",
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
        roomValue = value;
      });

      let quoteSplit = [...this.data.quotes];
      $("#input-speedup").on("input", e => {
        let value = e.target.value;
        let typoIndex = -1;
        let typoText = "";
        let correctText = "";
        let restText = "";
        let correctIndex = -1;

        if (value === "") {
          $(".rest-text").html(`
          ${quoteSplit
            .map(
              text => `
            <span class="p-1">${text}</span>
          `
            )
            .join("")}
          `);
        }

        for (let i = 0; i < value.length; i++) {
          restText = quoteSplit.slice(value.length, quoteSplit.length);
          $(".rest-text").html(`
          ${restText
            .map(
              text => `
            <span class="p-1">${text}</span>
          `
            )
            .join("")}
        `);
          if (value[i] !== quoteSplit[i]) {
            typoIndex = i;
            $(".typo-text").show();
            if (value === "") {
              correctText = quoteSplit.slice(0, 0);
              $(".correct-text").html(`
              ${correctText
                .map(
                  text => `
                <span class="p-1">${text}</span>
              `
                )
                .join("")}
            `);
            }
            typoText = quoteSplit.slice(typoIndex, value.length);
            $(".typo-text").html(`
            ${typoText
              .map(
                text => `
              <span class="p-1">${text}</span>
            `
              )
              .join("")}
          `);
            break;
          }
          $(".correct-text").show();
          correctIndex = i;
          correctText = quoteSplit.slice(0, i + 1);
          $(".correct-text").html(`
            ${correctText
              .map(
                text => `
              <span class="p-1">${text}</span>
            `
              )
              .join("")}
          `);
        }
        if (typoIndex == -1) {
          $(".typo-text").hide();
        }
        if (correctIndex == -1) {
          $(".correct-text").hide();
        }
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
      $(".speedup-game-container").hide();
      if (!this.data.debug) {
        this.handleSocket();
      } else {
        // $(".speedup-quotes").text(this.data.quotes);
        console.log("in debug mode");
        $(".speedup-game-container").fadeIn();
      }
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

      socket.on("room full", () => {
        console.log("room full");
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

      socket.on("game is ready", () => {
        console.log("game ready");
        this.data.isGameReady = true;
        $(".btn-start")
          .attr("disabled", false)
          .css({
            opacity: 1,
            cursor: "pointer"
          });
      });

      socket.on("game not ready", () => {
        console.log("game is not ready ....");
        this.data.isGameReady = false;
        $(".btn-start")
          .attr("disabled", true)
          .css({
            opacity: 0.3,
            cursor: "not-allowed"
          });
      });

      socket.on("start game", () => {
        console.log("game started");
        $(".speedup-quotes").text(this.data.quotes);
        this.startGame();
      });

      socket.on("start room timer", ({ roomTimer }) => {
        console.log("room timer", roomTimer);
        $(".timer-room").text(roomTimer);
      });

      socket.on("creator stop timer room", () => {
        console.log("im creator and room is done");
        this.data.isCreatorRoom = false;
        socket.emit("reply creator stop timer room", {
          socketID: this.data.socketID,
          roomID: this.data.roomID
        });
        $(".speedup-popup").fadeOut();
      });

      socket.on("room timer done", () => {
        $(".speedup-popup").fadeOut();
        socket.emit("reset user in timer done", {
          socketID: this.data.socketID
        });
        // this.setData({
        //   roomID: null,
        //   isCreator: false,
        //   inRoom: false,
        //   inGame: false
        // });
        // console.log("room timer done");
      });

      socket.on("update users in room", ({ users }) => {
        console.log("user in room", users);

        this.data.usersInRoom = [
          ...users,
          ...Array(this.data.usersInRoom.length - users.length).fill(
            "waiting..."
          )
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

        $(".inner-speedup-game .user-list").html(`
          ${this.data.usersInRoom
            .map(
              user => `
            <div>${user.username || ""}</div>
          `
            )
            .join("")} 
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

        $(".btn-start").on("click", () => {
          if (!this.data.isGameReady) {
            return;
          } else {
            console.log("lets to game");
            socket.emit("creator start to game", {
              roomID: this.data.roomID
            });
          }
        });
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
      this.setData(
        { roomID: faker.random.number(), isCreatorRoom: true },
        () => {
          console.log(this.data);
          $(".room-code").text(this.data.roomID);
          socket.emit("create room", {
            roomID: this.data.roomID,
            socketID: this.data.socketID,
            creatorRoom: this.data.username
          });
        }
      );
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

    startGame() {
      $(".speedup-popup").fadeToggle();
      $(".speedup-room-container").fadeToggle();
      $(".speedup-game-container").fadeIn();
      socket.emit("in game", {
        socketID: this.data.socketID,
        roomID: this.data.roomID
      });
    }
  }

  class Game extends Room {
    constructor() {
      super();
      console.log("game", this.data);
    }

    handleGameSocket() {
      console.log("game socket");
    }

    handleGameEvent() {}

    init() {
      super.init();
      this.handleGameSocket();
      this.handleGameEvent();
    }
  }

  let game = new Game();
  game.init();
});

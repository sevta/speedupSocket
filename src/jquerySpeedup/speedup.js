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
      $(".speedup-game-container").hide();
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

        $(".inner-speedup-game").html(`
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

  //   new Vue({
  //     el: "#game",
  //     data() {
  //       return {
  //         count: 0,
  //         inGame: false,
  //         popup: false,
  //         popupRoom: false,
  //         toggleJoin: false,
  //         username: faker.name.findName(),
  //         socketID: null,
  //         roomID: null,
  //         isCreatorRoom: false,
  //         inRoom: false,
  //         inGame: false,
  //         roomFound: false,
  //         isUserReady: false,
  //         isGameReady: false,
  //         usersInRoom: [...Array(4).fill("waiting")]
  //       };
  //     },
  //     template: `
  //       <div>
  //         <popup-room
  //           v-if="popupRoom"
  //           :onClick="hidePopupRoom"
  //           timer="30"
  //           :users="usersInRoom"
  //           roomCode="1234">
  //         </popup-room>
  //         <h1>hello {{ username }}</h1>
  //         <input v-if="toggleJoin" type="text" placeholder="input room code" />
  //         <div class="button-container">
  //           <button class="bg-teal text-white p-2 btn-create" @click="createRoom">create</button>
  //           <button class="bg-teal text-white p-2 btn-join" @click="joinRoom">join</button>
  //         </div>
  //       </div>
  //     `,
  //     mounted() {
  //       this.handleSocket();
  //     },
  //     methods: {
  //       handleSocket() {},
  //       createRoom() {
  //         this.popupRoom = true;
  //       },
  //       joinRoom() {
  //         this.toggleJoin = !this.toggleJoin;
  //       },
  //       hidePopupRoom() {
  //         this.popupRoom = false;
  //       }
  //     }
  //   });
  // });

  // Vue.component("popup-room", {
  //   props: ["onClick", "timer", "roomCode", "users"],
  //   template: `
  //     <div
  //       class="speedup-popup bg-black fixed pin-y pin-x flex items-center justify-center"
  //       @click="onClick"
  //     >
  //       <div
  //         class="inner-speedup-popup w-auto bg-white p-4 flex items-center justify-center flex-col"
  //       >
  //         <h1>speedup</h1>
  //         <div class="timer-room">{{timer}}</div>
  //         <p class="room-code">roomcode is{{ roomCode }}</p>
  //         <div class="user-list-container flex flex-col" v-for="user in users">{{user}}</div>
  //       </div>
  //     </div>
  //   `
});

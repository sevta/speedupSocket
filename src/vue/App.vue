<template>
  <div id="game-s">
    <game v-if="inGame" :users="usersInRoom" :socket-id="socketID" :socket="socket"></game>
    <popup-room
      v-if="popupRoom"
      :onbackdropclick="backdropClick"
      :room-timer="timerRoom"
      :room-code="roomID"
      :users="usersInRoom"
      :socket-id="socketID"
      :on-user-ready="onUserReady"
      :is-game-ready="isGameReady"
      :on-creator-start-game="onCreatorStartGame"
    ></popup-room>
    <div class="loby" v-if="!inGame">
      <h1>{{ username }}</h1>
      <p>socket id {{ socketID }}</p>
      <form class="speedup-inputroomcode-form" v-if="toggleJoin" @submit="onSubmit">
        <input
          type="text"
          placeholder="input room code"
          class="input-room-code"
          v-model="searchRoomCode"
          @input="onInput"
        >
      </form>
      <div class="button-container">
        <button class="bg-teal text-white p-2 btn-create" @click="createRoom">create</button>
        <button class="bg-teal text-white p-2 btn-join" @click="joinRoom">join</button>
      </div>
    </div>
  </div>
</template>

<script>
import popupRoom from "./Room";
import game from "./Game";
import io from "socket.io-client";
export default {
  name: "App",
  components: {
    popupRoom,
    game
  },
  data() {
    return {
      title: "hellow",
      inGame: false,
      popupRoom: false,
      timerRoom: 0,
      searchRoomCode: null,
      toggleJoin: false,
      username: null,
      socketID: null,
      roomID: null,
      isCreatorRoom: false,
      inRoom: false,
      inGame: false,
      roomFound: false,
      isUserReady: false,
      isGameReady: false,
      debug: false,
      socket: null,
      usersInRoom: [...Array(4).fill("waiting")]
    };
  },
  mounted() {
    console.log("mounted");
    fetch("https://uinames.com/api/?amount=25")
      .then(res => res.json())
      .then(data => {
        let random = val => Math.floor(Math.random() * data.length);
        this.username = data[random(data)].name;
        console.log("username", this.username);
        this.socket = io.connect("http://localhost:4200");
        if (this.debug) {
          this.inGame = true;
        } else {
          this.handleSocket();
          console.log("handle socket");
          console.log(socket);
        }
      })
      .catch(err => console.log(err));
  },
  methods: {
    handleSocket() {
      // first connect
      console.log("first connect");
      this.socket.on("first connect", ({ socketID }) => {
        console.log(socketID);
        this.socketID = socketID;
        console.log("first connect", this.socketID);
        this.socket.emit("reply connect", {
          username: this.username,
          socketID: this.socketID
        });
      });

      // start timer room
      this.socket.on("start room timer", ({ roomTimer }) => {
        console.log("room timer", roomTimer);
        this.timerRoom = roomTimer;
      });

      // timer done
      this.socket.on("room timer done", () => {
        this.popupRoom = false;
        this.socket.emit("reset user in timer done", {
          socketID: this.socketID
        });
      });
      this.socket.on("creator stop timer room", () => {
        console.log("im creator and room is done");
        this.isCreatorRoom = false;
        this.socket.emit("reply creator stop timer room", {
          socketID: this.socketID,
          roomID: this.roomID
        });
      });
      this.socket.on("room found", ({ roomID }) => {
        console.log("room found", roomID);
        this.roomFound = true;
        this.roomID = roomID;
        this.popupRoom = true;
      });
      this.socket.on("reply creator leave room", () => {
        console.log("socket leave room");
        this.roomID = null;
        this.popupRoom = false;
      });
      this.socket.on("update users in room", ({ users }) => {
        console.log("users", users);
        this.usersInRoom = [
          ...users,
          ...Array(this.usersInRoom.length - users.length).fill("waiting...")
        ];
      });
      this.socket.on("creator disconnect", () => {
        console.log("creator disconnect");
        this.roomID = null;
        this.popupRoom = false;
      });
      this.socket.on("game is ready", () => {
        console.log("game ready");
        this.isGameReady = true;
      });
      this.socket.on("start game", () => {
        this.startGame();
      });
    },
    createRoom() {
      this.popupRoom = true;
      console.log("create room");
      this.roomID = Date.now().toString();
      this.isCreatorRoom = true;
      this.socket.emit("create room", {
        roomID: this.roomID,
        socketID: this.socketID,
        creatorRoom: this.username
      });
    },
    backdropClick() {
      this.popupRoom = false;
      console.log("backdrop click");
      console.log("close popup room");
      if (this.isCreatorRoom) {
        console.log("creator leave room");
        this.isCreatorRoom = false;
        this.socket.emit("creator leave room", {
          roomID: this.roomID
        });
      } else {
        console.log("user leave room");
        this.roomFound = false;
        this.socket.emit("user leave room", {
          roomID: this.roomID,
          socketID: this.socketID
        });
      }
    },
    joinRoom() {
      console.log("join room");
      this.toggleJoin = !this.toggleJoin;
    },
    onInput() {
      console.log(this.searchRoomCode);
    },
    onSubmit(e) {
      e.preventDefault();
      console.log("submit", this.searchRoomCode);
      this.socket.emit("find room", {
        socketID: this.socketID,
        roomValue: this.searchRoomCode
      });
    },
    onUserReady() {
      console.log("im ready");
      this.socket.emit("user ready", {
        roomID: this.roomID,
        socketID: this.socketID
      });
    },
    onCreatorStartGame() {
      console.log("start game...");
      this.socket.emit("creator start to game", {
        roomID: this.roomID
      });
    },
    startGame() {
      this.popupRoom = false;
      this.inGame = true;
      console.log("game started");
      this.socket.emit("in game", {
        socketID: this.socketID,
        roomID: this.roomID
      });
    }
  }
};
</script>

<style lang="scss" scoped>
</style>

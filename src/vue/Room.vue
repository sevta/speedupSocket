<template>
  <div
    class="speedup-popup bg-black fixed pin-y pin-x flex items-center justify-center"
    @click="onbackdropclick"
  >
    <div
      class="inner-speedup-popup w-auto bg-white p-4 flex items-center justify-center flex-col"
      @click="innerPopupClick"
    >
      <h1>speedup</h1>
      <div class="timer-room">{{ roomTimer }}</div>
      <p class="room-code">{{ roomCode }}</p>
      <div
        class="user-list-container flex flex-col"
        v-for="(user , index) in users"
        v-bind:key="index"
      >{{ user.username || 'waiting' }} {{ user.isReady ? 'ready' : "" }}</div>
      <div v-for="(user , index) in users" v-bind:key="'a' + index">
        <button
          @click="onCreatorStartGame"
          :disabled="user.isCreator && user.socketID === socketId && !isGameReady"
          v-if="user.isCreator && user.socketID === socketId"
          class="btn-start bg-teal text-white py-2 px-4"
        >start game</button>
        <button
          @click="onUserReady"
          :disabled="!user.isCreator && user.socketID === socketId && user.isReady"
          v-if="!user.isCreator && user.socketID === socketId"
          class="btn-ready bg-red text-white py-2 px-4"
        >ready</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "popupRoom",
  props: {
    onbackdropclick: Function,
    roomTimer: Number,
    roomCode: String,
    users: Array,
    socketId: String,
    onUserReady: Function,
    isGameReady: Boolean,
    onCreatorStartGame: Function
  },
  mounted() {
    console.log("user in prop", this.users, this.roomCode, this.socketId);
  },
  methods: {
    innerPopupClick(e) {
      e.stopPropagation();
    }
  }
};
</script>

<style lang="scss" scoped>
.btn-start {
  &:disabled {
    filter: grayscale(0.5);
    cursor: not-allowed;
  }
}
.btn-ready {
  background: tomato;
  &:disabled {
    filter: grayscale(0.5);
    cursor: not-allowed;
  }
}
</style>


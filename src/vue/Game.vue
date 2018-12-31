<template>
  <div class="game-container">
    <h1>game is {{ title }}</h1>
    <h1>{{ quotes }}</h1>
    <p>{{ typedText }}</p>
    <h1>step {{ step }}</h1>
    <h3>socket id {{ socketId }}</h3>
    <p v-if="isTypo" class="text-red font-bold my-2 text-center">pleace correct the typo</p>
    <div
      v-for="(user , index) in users"
      :key="index"
      v-bind:style="[user.socketID === socketId ? avatarMove : null ]"
    >{{ user.username || 'waiting' }}</div>
    <div class="quote flex">
      <span
        unselectable="on"
        class="correct text-white bg-teal font-bold p-1"
        v-if="isCorrect"
        v-for="(correct , i) in correctText"
        :key="'correct' + i"
      >{{ correct }}</span>
      <div
        unselectable="on"
        class="typo text-white font-bold bg-red p-1"
        v-if="isTypo"
        v-for="(typo , i) in typoText"
        :key="'typo' + i"
      >{{ typo }}</div>
      <div
        unselectable="on"
        class="text-black p-1 bg-grey-lighter"
        v-for="(rest , i) in restText"
        :key="'rest' + i"
      >{{ rest }}</div>
    </div>
    <input
      type="text"
      placeholder="input here..."
      class="p-2 border"
      v-model="typedText"
      autocorrect="off"
      autocapitalize="off"
      @input="checkCursorSelection"
    >
  </div>
</template>

<script>
export default {
  name: "game",
  props: ["users", "socketId", "socket"],
  data() {
    return {
      title: "gamesdf",
      quotes: "aduh is real aduh hjgf",
      correctText: "",
      typoText: "",
      restText: "",
      typedText: "",
      typoIndex: -1,
      isTypo: false,
      isCorrect: false,
      step: 0,
      x: 0,
      y: 0,
      cursorPosition: 0,
      quotesSplit: [],
      stateMove: "right"
    };
  },
  mounted() {
    this.extractWords();
    console.log("socket", socket);
  },
  computed: {
    avatarMove() {
      // console.log(user);
      return {
        color: "red",
        fontSize: "13px",
        transform: `translateX(${this.x}em) translateY(${this.y}em)`,
        transition: "all .6s ease"
      };
    }
  },
  watch: {
    typedText(value) {
      // this.checkWord();
      this.checkByArray();
      this.userMovement();
    }
  },
  methods: {
    extractWords() {
      this.quotesSplit = [...this.quotes];
      console.log(this.quotesSplit);
    },
    checkCursorSelection(e) {
      let position = e.target.selectionStart;
      this.cursorPosition = position;
      console.log(this.cursorPosition);
    },
    userMovement() {
      if (!this.isTypo) {
        if (this.step >= 0) {
          this.stateMove = "moveright";
          this.x = this.step;
          this.y = 0;
        }
        if (this.step >= 20) {
          this.stateMove = "moveright movedown";
          this.x = this.step;
          this.y = this.step - 25;
        }
      }

      console.log("stateMove", this.stateMove, this.x, this.y);
    },
    checkByArray() {
      let correctIndex = -1;
      this.restText = this.quotesSplit.slice(
        this.typedText.length,
        this.quotes.length
      );
      if (this.typedText === "") {
        this.correctText = "";
        this.typoText = "";
        this.step = 0;
        this.isTypo = false;
        this.isCorrect = false;
      }
      for (let i = 0; i < this.typedText.length; i++) {
        if (this.step === this.quotesSplit.length - 1) {
          // this is winner
        }
        if (this.typedText[i] !== this.quotes[i]) {
          this.typoIndex = i;
          this.step = parseInt(((i + 1) / this.quotesSplit.length) * 100);
          this.isTypo = true;
          if (i === 0) {
            this.correctText = this.quotesSplit.slice(0, 0);
          }
          this.typoText = this.quotesSplit.slice(
            this.typoIndex,
            this.typedText.length
          );
          break;
        }
        this.isTypo = false;
        this.isCorrect = true;
        console.log("correct index", i + 1);
        correctIndex = i;
        this.step = parseInt(((i + 1) / this.quotesSplit.length) * 100);
        console.log(this.step);
        this.correctText = this.quotesSplit.slice(0, i + 1);
      }
    },
    checkWord() {
      this.restText = this.quotes.slice(
        this.typedText.length,
        this.quotes.length
      );
      if (this.typedText === "") {
        this.correctText = "";
        this.typoText = "";
        this.step = 0;
        this.isTypo = false;
        this.isCorrect = false;
      }
      for (let i = 0; i < this.typedText.length; i++) {
        this.step = i;
        if (this.typedText[i] !== this.quotes[i]) {
          this.typoIndex = i;
          this.isTypo = true;
          console.log("step ", this.step);
          console.log("typo", this.typoIndex);
          console.log(this.quotes.slice(this.typoIndex, this.typedText.length));
          this.typoText = this.quotes.slice(
            this.typoIndex,
            this.typedText.length
          );

          break;
        }
        this.isTypo = false;
        this.isCorrect = true;
        console.log("correct");
        console.log("step ", this.step);
        this.correctText = this.quotes.slice(0, i + 1);
        console.log("rest", this.restText);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.correct {
  transition: all 0.2s ease;
}
</style>

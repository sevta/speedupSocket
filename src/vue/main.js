import Vue from "vue";
import App from "./App";
// import VueSocketIO from "vue-socket.io";

// Vue.use(
//   new VueSocketIO({
//     debug: true,
//     connection: "http://localhost:4200"
//   })
// );

Vue.config.productionTip = false;

new Vue({
  el: "#app",
  render: h => h(App)
});

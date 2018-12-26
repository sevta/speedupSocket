import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Provider, AppContext } from "./utils/Provider";
import Room from "./component/room/Room";
import Game from "./component/game/Game";

class SpeedUp extends Component {
  static contextType = AppContext;

  render() {
    const { state } = this.context;
    return (
      <div className="speedup-container">
        {state.toGame ? <Game /> : <Room />}
      </div>
    );
  }
}

ReactDOM.render(
  <Provider>
    <SpeedUp />
  </Provider>,
  document.querySelector("#app")
);

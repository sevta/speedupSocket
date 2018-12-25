import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Provider, AppContext } from "./utils/Provider";
import Room from "./component/room/Room";
import InputRoomCode from "./component/room/InputRoomCode";

class SpeedUp extends Component {
  static contextType = AppContext;

  componentDidMount = () => {
    const { socket } = this.context;
    socket.on("first connect", data => {
      console.log(data);
    });
  };

  createRoom = () => {
    const { setState, socket } = this.context;
    setState(
      { createRoom: true, roomID: 1234, isCreatorRoom: true },
      currState => {
        socket.emit("create room", {
          roomID: currState.roomID,
          socketID: currState.socketID,
          creatorRoom: currState.username
        });
      }
    );
  };

  joinRoom = () => {
    const { state, setState } = this.context;
    setState({ toggleInputRoomCode: !state.toggleInputRoomCode });
  };

  renderRoom = () => {
    const { state } = this.context;
    if (state.createRoom || state.roomFound) {
      return <Room />;
    }
  };

  render() {
    const { state } = this.context;
    return (
      <div className="speedup-container">
        <h1>hello {state.username}</h1>
        {this.renderRoom()}
        {state.toggleInputRoomCode && <InputRoomCode />}
        <button
          className="bg-teal py-2 px-4 rounded text-sm text-white"
          onClick={this.createRoom}
        >
          create room
        </button>
        <button
          className="bg-purple py-2 px-4 rounded text-sm text-white"
          onClick={this.joinRoom}
        >
          join room
        </button>
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

import React, { Component } from "react";
import { AppContext } from "../../utils/Provider";
import PopupRoom from "./PopupRoom";
import InputRoomCode from "./InputRoomCode";

export default class Room extends Component {
  static contextType = AppContext;

  componentDidMount = () => {
    const { socket } = this.context;
    socket.on("first connect", data => {
      console.log(data);
    });
  };

  createRoom = () => {
    const { setState, socket } = this.context;

    let fakeId = Date.now();
    console.log("fake id", fakeId);

    setState(
      { createRoom: true, roomID: fakeId, isCreatorRoom: true },
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
      return <PopupRoom />;
    }
  };

  render() {
    const { state } = this.context;
    return (
      <div className="speedup-room">
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

import React, { Component } from "react";
import { AppContext } from "../../utils/Provider";

export default class InputRoomCode extends Component {
  state = {
    value: ""
  };

  static contextType = AppContext;

  inputRoomCode = e => {
    let value = e.target.value;
    console.log("value", value);
    this.setState({ value });
  };

  submitRoomCode = e => {
    e.preventDefault();
    const { socket, state } = this.context;
    socket.emit("find room", {
      socketID: state.socketID,
      roomValue: this.state.value
    });
  };

  render() {
    return (
      <div className="room-code">
        <form onSubmit={this.submitRoomCode}>
          <input
            type="text"
            value={this.state.value}
            placeholder="room code"
            onChange={this.inputRoomCode}
          />
        </form>
      </div>
    );
  }
}

import React, { Component } from "react";
import { AppContext } from "../../utils/Provider";
import "./style.scss";

export default class Room extends Component {
  static contextType = AppContext;

  closeRoom = () => {
    const { state, socket, setState } = this.context;
    if (state.isCreatorRoom) {
      console.log("creator leave room");
      setState({ createRoom: false, isCreatorRoom: false }, currState => {
        socket.emit("creator leave room", {
          roomID: currState.roomID
        });
      });
    } else {
      console.log("user leave room", state.roomID);
      setState({ createRoom: false, roomFound: false });
      socket.emit("user leave room", {
        roomID: state.roomID,
        socketID: state.socketID
      });
    }
  };

  render() {
    const { state } = this.context;
    return (
      <div
        className="room-container bg-black fixed pin-y pin-x flex items-center justify-center"
        onClick={this.closeRoom}
      >
        <div className="inner-room p-3 rounded bg-white text-black">
          <p>{state.roomID}</p>
          <div className="users-container">
            <UserList users={state.usersInRoom} />
          </div>
          {state.isCreatorRoom ? (
            <button className="py-2 px-4 bg-blue py-2 px-4 text-sm rounded text-white">
              start game
            </button>
          ) : (
            <button className="py-2 px-4 bg-teal py-2 px-4 text-sm rounded text-white">
              ready
            </button>
          )}
        </div>
      </div>
    );
  }
}

function UserList({ users }) {
  return users.map((user, i) => (
    <div key={i + 1}>
      <h4>{user.username || "waiting..."}</h4>
    </div>
  ));
}

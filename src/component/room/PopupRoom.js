import React, { Component } from "react";
import { AppContext } from "../../utils/Provider";
import "./style.scss";

export default class PopupRoom extends Component {
  static contextType = AppContext;

  state = {
    isReady: false
  };

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
      setState({ createRoom: false, roomFound: false, isReady: false });
      socket.emit("user leave room", {
        roomID: state.roomID,
        socketID: state.socketID
      });
    }
  };

  onUserReady = () => {
    const { state, socket } = this.context;
    console.log("im ready", state.roomID);
    socket.emit("user ready", {
      roomID: state.roomID,
      socketID: state.socketID
    });
  };

  render() {
    const { state } = this.context;
    return (
      <div
        className="room-container bg-black fixed pin-y pin-x flex items-center justify-center"
        onClick={this.closeRoom}
      >
        <div
          className="inner-room p-3 rounded bg-white text-black"
          onClick={e => e.stopPropagation()}
        >
          <p>{state.roomID}</p>
          <div className="users-container">
            <UserList users={state.usersInRoom} />
          </div>
          {state.isCreatorRoom ? (
            <button
              className={`py-2 px-4 ${
                state.isGameReady
                  ? "bg-blue"
                  : "bg-blue-light cursor-not-allowed"
              } py-2 px-4 text-sm rounded text-white`}
              disabled={!state.isGameReady}
            >
              start game
            </button>
          ) : (
            <button
              className={`py-2 px-4 ${
                state.isReady ? "bg-teal-light cursor-not-allowed" : "bg-teal"
              } py-2 px-4 text-sm rounded text-white`}
              onClick={this.onUserReady}
              disabled={state.isReady}
            >
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
      <h4>
        {user.username || "waiting..."} {user.isReady ? "ready" : ""}{" "}
      </h4>
    </div>
  ));
}

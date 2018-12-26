import React, { Component } from "react";
import io from "socket.io-client";
// import faker from "faker";'
let socket = io.connect("http://localhost:4200");
import names from "./fakeName";

export let AppContext = React.createContext();

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class Provider extends Component {
  state = {
    // socket state
    username: `${random(names).first_name} ${random(names).last_name}`,
    socketID: null,
    roomID: null,
    createRoom: false,
    isCreatorRoom: false,
    isReady: false,
    // room
    toggleInputRoomCode: false,
    usersInRoom: [...Array(4).fill("waiting")],
    isGameReady: false,

    // searchinf room
    roomFound: false,

    // game
    toGame: true
  };

  componentDidMount = () => {
    this.handleSocket();
    console.log(this.state);
  };

  handleSocket = () => {
    socket.on("first connect", data => {
      console.log(data);
      this.setState({ socketID: data.socketID }, () => {
        socket.emit("reply connect", {
          username: this.state.username,
          socketID: this.state.socketID
        });
      });
    });

    socket.on("room found", ({ roomID }) => {
      this.setState({ roomFound: true, roomID: roomID });
    });

    socket.on("room not found", data => {
      this.setState({ roomFound: false });
    });

    socket.on("reply creator leave room", () => {
      console.log("socket leave room");
      this.setState({
        createRoom: false,
        roomFound: false,
        isReady: false,
        isCreatorRoom: false
      });
    });

    socket.on("creator disconnect", () => {
      console.log("creator disconnect");
      this.setState({
        createRoom: false,
        roomFound: false,
        isReady: false,
        isCreatorRoom: false
      });
    });

    socket.on("game is ready", () => {
      console.log("game ready");
      this.setState({ isGameReady: true });
    });

    socket.on("game not ready", () => {
      console.log("game is not ready");
      this.setState({ isGameReady: false });
    });

    socket.on("update users in room", ({ users }) => {
      console.log("user in room", users);
      this.state.usersInRoom = [
        ...users,
        ...Array(this.state.usersInRoom.length - users.length).fill(
          "waiting..."
        )
      ];

      this.setState({ usersInRoom: this.state.usersInRoom }, () => {
        this.state.usersInRoom.map(user => {
          if (user.socketID == this.state.socketID && user.isReady) {
            console.log("user ready is", user);
            this.setState({ isReady: true });
          }
        });
      });
    });
  };

  render() {
    return (
      <AppContext.Provider
        value={{
          state: this.state,
          socket,
          setState: (payload, cb) => {
            this.setState(payload, () => {
              if (cb) {
                cb(this.state);
              }
            });
          }
        }}
      >
        {this.props.children}
      </AppContext.Provider>
    );
  }
}

import React, { Component } from "react";
import io from "socket.io-client";
import faker from "faker";

let socket = io.connect("http://localhost:4200");

export let AppContext = React.createContext();

export class Provider extends Component {
  state = {
    // socket state
    username: faker.name.findName(),
    socketID: null,
    roomID: null,
    createRoom: false,
    isCreatorRoom: false,

    // room
    toggleInputRoomCode: false,
    usersInRoom: [...Array(4).fill("waiting")],

    // searchinf room
    roomFound: false
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
      this.setState({ createRoom: false, roomFound: false });
    });

    socket.on("creator disconnect", () => {
      console.log("creator disconnect");
      this.setState({ createRoom: false, roomFound: false });
    });

    socket.on("update users in room", ({ users }) => {
      console.log("user in room", users);
      this.state.usersInRoom = [
        ...users,
        ...Array(this.state.usersInRoom.length - users.length).fill(
          "waiting..."
        )
      ];
      this.setState({ usersInRoom: this.state.usersInRoom });
    });
  };

  componentDidMount = () => {
    this.handleSocket();
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

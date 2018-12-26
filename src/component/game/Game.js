import React, { Component } from "react";
import Avatar from "./Avatar";

function selector(el) {
  return document.querySelectorAll(el);
}

export default class Game extends Component {
  constructor() {
    super();
    this.wordRef = React.createRef();
  }

  state = {
    question: "tesi makan bubur",
    extractWords: [],
    value: "",
    position: 0,
    step: 0,
    moveState: null,
    isBackSpace: false,
    isFalse: false
  };

  componentDidMount = () => {
    this.extractWords().then(() => {
      console.log("ref", this.wordRef);
      let el = selector(".s-word");
      console.log("el", el);
    });
  };

  extractWords = () => {
    return new Promise(resolve => {
      const { question } = this.state;
      let splitQuestion = [...question];
      this.setState({ extractWords: splitQuestion });
      console.log("split question", splitQuestion);
      resolve(splitQuestion);
    });
  };

  onKeyDown = e => {
    const { extractWords, position, isBackSpace, isFalse } = this.state;
    let value = e.target.value;
    // console.log(e);
    this.setState({ value });
    let el = selector(".s-word");
    let inputBox = selector(".speedup-input");
    let cursorPosition = inputBox[0].selectionStart;
    // console.log(inputBox, cursorPosition);

    console.log(extractWords[cursorPosition], e.key);
    if (e.key == "Backspace") {
      console.log("backspace");
      this.setState({ isBackSpace: true });
    } else {
      this.setState({ isBackSpace: false });
    }
    if (!isFalse) {
      if (e.key === extractWords[cursorPosition]) {
        console.log("next", el[cursorPosition]);
        this.setState({ isFalse: false });
        el[cursorPosition].style.background = "tomato";
      } else {
        console.log("back");
        this.setState({ isFalse: true });
        if (!isBackSpace) {
          el[cursorPosition].style.background = "transparent";
        } else {
          el[cursorPosition - 1].style.background = "transparent";
        }
      }
    } else {
      el[cursorPosition].style.background = "red";
    }
  };

  render() {
    const { extractWords } = this.state;

    return (
      <div>
        <h1>Game</h1>
        <Word extractWords={extractWords} refs={this.wordRef} />
        <Input onKeyDown={this.onKeyDown} />
        <Avatar />
      </div>
    );
  }
}

class Word extends Component {
  render() {
    return (
      <div className="flex flex-wrap">
        {this.props.extractWords.map((word, i) => (
          <div
            key={i + 1}
            data-index={i}
            data-word={word}
            className="s-word text-xl p-2"
            ref={this.props.refs}
          >
            {word}
          </div>
        ))}
      </div>
    );
  }
}

function Input({ ...rest }) {
  return (
    <div className="mb-2">
      <input
        type="text"
        placeholder="input..."
        className="speedup-input p-3 border"
        {...rest}
      />
    </div>
  );
}

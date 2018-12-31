import React, { Component } from "react";
import Avatar from "./Avatar";
import { async } from "q";

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
    moveState: null
  };

  componentDidMount = () => {
    await this.extractWords();
    console.log("ref", this.wordRef);
    let el = selector(".s-word");
    console.log("el", el);
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

  onChange = e => {
    const { extractWords, position } = this.state;
    let value = e.target.value;
    this.setState({ value });
    if (value == extractWords[position]) {
      console.log("next");
      this.setState({ moveState: "forward" });
    } else {
      console.log("false");
      this.setState({ moveState: "back" });
    }
  };

  render() {
    const { extractWords } = this.state;

    return (
      <div>
        <h1>Game</h1>
        <Word extractWords={extractWords} refs={this.wordRef} />
        <Input onChange={this.onChange} />
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

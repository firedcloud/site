import React from 'react'

export default class Counter extends React.Component {
  state = {
    count: 0
  };

  render() {
    return (
      <div>
        <button onClick={this.increment}>Click me</button> click count: {this.state.count}
      </div>
    )
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  }
}

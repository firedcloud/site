# Woah, dude

You can serve your React component with one command: `woah`.

```
$ touch index.js
$ echo "import React from 'react'; export default <div>Hello world</div>" > index.js
$ woah
```

Useful, when you are too lazy to setup another build pipeline, but do not need tons of boilerplate code from another starter-kit or create-app.


## Installation

```
yarn global add woah
# or
npm i -g woah
```


## Usage

```
woah [<filename>] [--port <port>]
```

By default it serves index.js from current directory.


## Your file

To render React component, export it by default:

```
import React from 'react'; // it's alias to package's react 16
export default class MyFancyComponent extends React.Component {
  render() {
    <div>Woah, dude!</div>;
  }
}
```

```
import React from 'react'; // it's alias to package's react 16
export default function() {
  return <div>Woah, dude!</div>;
}
```

But you can also render React without exporting anything:

```
import React from 'react'; // 'react' is provided
import ReactDOM from 'react-dom'; // but you should install 'react-dom' by yourself

ReactDOM.render(<div>Woah, dude!</div>, document.querySelector('#root'));
```

See [examples](/examples)


## Configuration

No configuration. You do not need it.


## Roadmap

1. Rebuild on changes
2. ???
3. PROFIT

See issues list.

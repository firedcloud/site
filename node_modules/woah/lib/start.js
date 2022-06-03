import React from 'react';
import ReactDOM from 'react-dom';

import * as entryModule from '__entry__';

const entry = entryModule.default;

if (typeof entry === 'function') {
  // if it's function, it's react component (fn/class)
  renderComponent(entry);
} else {
  // else it should be something renderable
  if (React.isValidElement(entry)) {
    renderElement(entry);
  }
}

function renderComponent(Component) {
  return renderElement(React.createElement(Component, null));
}

function renderElement(element) {
  ReactDOM.render(element, document.querySelector('#root'));
}

import React from 'react';
import logo from '../../assets/img/logo.svg';
import { Button } from 'antd';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';
chrome.bookmarks.getTree((tree) => {
  console.log(tree);
});

const Popup = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={ logo } className="App-logo" alt="logo" />
        <p>
          Edit <code>src/pages/Popup/Popup.jsx</code> and save to reload.
        </p>
        <Button onClick={ () => {
          chrome.tabs.create({
            url: "options.html"
          });
        } }>打开options</Button>
      </header>
    </div>
  );
};

export default Popup;

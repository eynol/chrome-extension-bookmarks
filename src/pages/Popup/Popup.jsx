import React from 'react';
import logo from '../../assets/img/logo.svg';
import { Button } from 'antd';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';
import Home from '../Options/pages/Home'

chrome.bookmarks.getTree((tree) => {
  console.log(tree);
});

const Popup = () => {
  return (
    <Home popup />
  );
};

export default Popup;

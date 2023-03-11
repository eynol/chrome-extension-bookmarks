import React from 'react';
import './Options.css';
import 'antd/dist/reset.css';
import {
  Layout,
  theme,
} from 'antd';

import { Pages } from '../../constants/kv';
import Home from './pages/Home';

interface Props {
  title: string;
}

const Options: React.FC<Props> = () => {
  const [page, setPage] = React.useState('home');
  const {
    token: { colorBgContainer },
  } = theme.useToken();


  return (
    <Layout style={{ minHeight: '100vh' }}>

      {page === Pages.Home && <Home />}
    </Layout>
  );
};

export default Options;

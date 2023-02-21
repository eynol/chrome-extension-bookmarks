import React, { useEffect } from 'react';
import './Options.css';
import 'antd/dist/reset.css';
import {
  Button,
  Tree,
  Modal,
  TreeDataNode,
  Layout,
  Menu,
  TreeSelect,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  SettingFilled,
} from '@ant-design/icons';
import { DataNode } from 'antd/lib/tree';
import { BaseOptionType } from 'antd/lib/select';
import { kSyncFolderId, Pages } from '../../constants/kv';
import Home from './pages/Home';
import Setting from './pages/Setting';
import { useSyncRunning } from './pages/hooks'
const { Content, Footer, Header, Sider } = Layout;

interface Props {
  title: string;
}

const menus = [
  {
    label: 'Home',
    icon: <HomeOutlined />,
    key: Pages.Home,
  },
  {
    label: 'Settings',
    icon: <SettingFilled />,
    key: Pages.Settings,
  },
];

const Options: React.FC<Props> = () => {
  const [page, setPage] = React.useState('home');
  const {
    token: { colorBgContainer },
  } = theme.useToken();


  return (
    <Layout hasSider style={{ minHeight: '100vh' }}>
      <Sider collapsible theme='light'>
        <Menu
          theme="light"
          // theme="auto"
          onSelect={(e) => {
            setPage(e.key);
          }}
          selectedKeys={[page]}
          items={menus}
          mode="inline"
        // items={items}
        />
      </Sider>
      {page === Pages.Home && <Home />}
      {page === Pages.Settings && <Setting />}
    </Layout>
  );
};

export default Options;

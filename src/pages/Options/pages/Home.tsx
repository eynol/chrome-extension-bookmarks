import React, { useCallback, useEffect, useRef } from 'react';
import {
  Button,
  Tree,
  Modal,
  TreeDataNode,
  Layout,
  Menu,
  TreeSelect,
  Spin,
  Result,
  Space,
  Card,
  Dropdown,
  MenuProps,
  message,
  Divider,
  BackTop,
} from 'antd';
import { ExtActions, kOriginalSyncPack, kSyncFolderId } from '../../../constants/kv';
import { DataNode } from 'antd/lib/tree';
import { DefaultOptionType } from 'antd/lib/select';
import useModal from 'antd/lib/modal/useModal';
import { useToggle } from 'ahooks';
import ChangeSyncFolder, {
  bookmarksToFolderData,
} from '../components/ChangeSyncFolder';
import { generateSyncPack } from '../../../actions/generateSyncPack';
import { useBookmarksTree, useSyncFolderId, useSyncRunning, useSyncVersion } from './hooks';
import FileSelectorWraper from '../components/FileSelector';
import { mergeSameNameOrSameUrlInSyncFolder } from '../../../actions/mergeSameNameOrSameUrlInSyncFolder';
import { restoreSyncPack } from '../../../actions/restoreSyncPack';
import { DownOutlined, EditFilled, EditOutlined, EditTwoTone, PauseCircleFilled, PlaySquareFilled } from '@ant-design/icons';
import ChangeSyncVersion from '../components/ChangeSyncVersion';
import { DiffResult } from '../components/DiffResult';

const bookmarksToTreeData = (treeData: any[]): DataNode[] => {
  return treeData.map((item) => {
    const { children, title, id, ...rest } = item;
    return {
      key: id,
      title,
      children: children && bookmarksToTreeData(children),
    };
  });
};
message.config({ duration: 3 })
const { Content, Footer, Header, Sider } = Layout;

enum homeStateActionType {
  setSyncFolderId,
  setBookmarks,
  clearSyncFolderId,
}

const homeStateReducer = (state: any, action: any) => {
  switch (action.type) {
    case homeStateActionType.setSyncFolderId: {
      return {
        ...state,
        syncFolderIdLoaded: true,
        syncFolderId: action.payload,
      };
    }
    case homeStateActionType.setBookmarks: {
      let originTreeData = action.payload;
      if (originTreeData?.length > 0) {
        originTreeData[0].title = 'Bookmarks';
      }
      const bookmarks = bookmarksToTreeData(originTreeData);
      const folders = bookmarksToFolderData(originTreeData);
      console.log({ bookmarks, folders });
      return {
        ...state,
        rawBookmarks: originTreeData,
        folders,
        bookmarks,
      };
    }
    default:
      return state;
  }
};




export default function Home() {

  const { syncVersion, remoteSyncVersion } = useSyncVersion()
  const { syncFolderId, handleChangeSyncFolder: setSyncFolderId, syncFolderName } = useSyncFolderId()
  const running = useSyncRunning()

  const [{ folders, bookmarks }, dispatch] =
    React.useReducer(homeStateReducer, {
      bookmarks: [],
      folders: [],
      syncFolderIdLoaded: false,
      syncFolderId: '',
    });

  const tree = useBookmarksTree()
  useEffect(() => {
    console.log('tree changed', tree)
    dispatch({
      type: homeStateActionType.setBookmarks,
      payload: tree,
    });
  }, [tree]);

  const onClickDropdown: MenuProps['onClick'] = async ({ key }) => {
    // 下载同步文件
    switch (key) {
      case 'download-snapshot': {
        const syncPack = await generateSyncPack();

        const text = JSON.stringify(syncPack, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const timeSuffix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        chrome.downloads.download({
          url,
          filename: `${syncPack.title}-sync-pack-${timeSuffix}.json`,
        })
        console.log(syncPack);

        break;
      }
      case 'clean-folder-id': {
        setSyncFolderId(undefined);
        break;
      }
      case 'merge-sync-folder': {
        await mergeSameNameOrSameUrlInSyncFolder();
        break;
      }
      case 'pause-sync': {
        await chrome.runtime.sendMessage(ExtActions.pauseSync)
        break
      }

      case 'resume-sync': {
        await chrome.runtime.sendMessage(ExtActions.resumeSync)
        break
      }
      default: {
        break;
      }
    }
    message.success('done')

  };


  const items: MenuProps['items'] = [
    { type: 'divider' },
    { label: '合并同步文件夹内的相同目录', key: 'merge-sync-folder', disabled: !syncFolderId },
    { label: '下载快照', key: 'download-snapshot', disabled: !syncFolderId },
    { type: 'divider' },
    running
      ? { label: '暂停同步', icon: <PauseCircleFilled />, key: 'pause-sync' }
      : { label: '开始同步', icon: <PlaySquareFilled />, key: 'resume-sync' },
    { type: 'divider' },
    { label: '清除同步目录id', danger: true, key: 'clean-folder-id' }, // 菜单项务必填写 key
  ];
  if (!syncFolderId) {
    return (
      <Layout>
        <Result
          status="warning"
          title="未选择同步文件夹"
          subTitle="请在书签列表中选择一个文件夹作为同步文件夹"
          extra={
            <ChangeSyncFolder
              value={syncFolderId}
              onChange={setSyncFolderId}
            >
              <Button
                type="primary"
                key="console"
              >
                去设置
              </Button>
            </ChangeSyncFolder>
          }
        ></Result>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header>
        <Space>
          <span>同步状态：{running ? '运行中' : '未运行'} </span>
          <Divider type='vertical'></Divider>
          <span>当前版本<ChangeSyncVersion ><EditFilled /></ChangeSyncVersion>:{syncVersion}/{remoteSyncVersion} </span>
          <Divider type='vertical'></Divider>
          <span>
            同步的目录<ChangeSyncFolder
              value={syncFolderId}
              onChange={setSyncFolderId}
            >
              <EditFilled />
            </ChangeSyncFolder>：{syncFolderName}

          </span>
          <Divider type='vertical'></Divider>
          <Dropdown menu={{ items, onClick: onClickDropdown }}>
            <a onClick={e => e.preventDefault()}>
              <Space>
                更多操作
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
          <Divider type='vertical'></Divider>
          <FileSelectorWraper onChange={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const data = JSON.parse(reader.result as string);

              chrome.storage.local.set({ [kOriginalSyncPack]: data }).then(() => {
                chrome.runtime.sendMessage(ExtActions.override)
              })
              // restoreSyncPack(data)
            };
            reader.readAsText(file);
            console.log(file)
          }}>
            <Button type="link" danger disabled={!syncFolderId}>上传快照覆盖</Button>
          </FileSelectorWraper>
        </Space>
      </Header>
      <Content>
        <Content>
          <DiffResult></DiffResult>
          <BackTop />
        </Content>
        <Modal title="选择书签"></Modal>
      </Content>
    </Layout>
  );
}

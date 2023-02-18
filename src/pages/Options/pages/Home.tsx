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
} from 'antd';
import { ExtActions, kModifiedRecord, kSyncFolderId } from '../../../constants/kv';
import { DataNode } from 'antd/lib/tree';
import { DefaultOptionType } from 'antd/lib/select';
import useModal from 'antd/lib/modal/useModal';
import { useToggle } from 'ahooks';
import ChangeSyncFolder, {
  bookmarksToFolderData,
} from '../components/ChangeSyncFolder';
import { generateSyncPack } from '../../../actions/generateSyncPack';
import { useBookmarksTree, useSyncFolderId, useSyncVersion } from './hooks';
import FileSelectorWraper from '../components/FileSelector';
import { mergeSameNameOrSameUrlInSyncFolder } from '../../../actions/mergeSameNameOrSameUrlInSyncFolder';
import { restoreSyncPack } from '../../../actions/restoreSyncPack';
import { DownOutlined, EditFilled, EditOutlined, EditTwoTone } from '@ant-design/icons';
import ChangeSyncVersion from '../components/ChangeSyncVersion';

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

  const [syncVersion] = useSyncVersion()
  const [syncFolderId, setSyncFolderId] = useSyncFolderId()
  const [{ folders, bookmarks, syncFolderIdLoaded }, dispatch] =
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

  const onClickDropdown: MenuProps['onClick'] = ({ key }) => {
    // 下载同步文件
    if (key === 'download-snapshot') {
      generateSyncPack().then(result => {
        const text = JSON.stringify(result, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const timeSuffix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        chrome.downloads.download({
          url,
          filename: `${result.title}-sync-pack-${timeSuffix}.json`,
        })
        message.success('done')
        console.log(result);
      })
    }

    // 删除同步id
    if (key === 'clean-folder-id') {
      setSyncFolderId(undefined);
      message.success('done')
    }
    if (key === 'merge-sync-folder') {
      mergeSameNameOrSameUrlInSyncFolder().then(() => {
        message.success('合并完成')
      })
    }
    message.info(`Click on item ${key}`);
  };


  const items: MenuProps['items'] = [
    { label: '合并同步文件夹内的相同目录', key: 'merge-sync-folder', disabled: !syncFolderId },
    { label: '下载快照', key: 'download-snapshot', disabled: !syncFolderId },
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
        {
          syncFolderId ? (
            <>
              <Space>
                <span>当前版本:{syncVersion} <ChangeSyncVersion ><EditFilled /></ChangeSyncVersion></span>
                <span> 同步的目录：{' '}
                  <TreeSelect
                    dropdownMatchSelectWidth={false}
                    placeholder="请选择需要同步的目录"
                    value={syncFolderId}
                    showAction={['click']}
                    // treeExpandedKeys={[kSyncFolderId]}
                    treeDefaultExpandAll
                    // disabled
                    treeLine={true}
                    treeData={folders}
                  />
                  <ChangeSyncFolder
                    value={syncFolderId}
                    onChange={setSyncFolderId}
                  >
                    <Button type="link">修改</Button>
                  </ChangeSyncFolder>
                </span>
              </Space>
              <Space>
                <Dropdown menu={{ items, onClick: onClickDropdown }}>
                  <a onClick={e => e.preventDefault()}>
                    <Space>
                      更多操作
                      <DownOutlined />
                    </Space>
                  </a>
                </Dropdown>
                <FileSelectorWraper onChange={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const data = JSON.parse(reader.result as string);

                    chrome.storage.local.set({ [kModifiedRecord]: data }).then(() => {
                      chrome.runtime.sendMessage(ExtActions.beginSync)
                    })
                    // restoreSyncPack(data)
                  };
                  reader.readAsText(file);
                  console.log(file)
                }}>
                  <Button type="link" danger disabled={!syncFolderId}>上传快照覆盖</Button>
                </FileSelectorWraper>
              </Space>
            </>
          ) : (
            <Button type="primary">立即同步</Button>
          )
        }
      </Header>
      <Content>
        <Content>
          <Tree
            showLine
            treeData={bookmarks}
            autoExpandParent
            defaultExpandedKeys={['0']}
            defaultExpandParent
          />
        </Content>
        <Modal title="选择书签"></Modal>
      </Content>
      <Footer>Footer</Footer>
    </Layout>
  );
}

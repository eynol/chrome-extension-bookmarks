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
} from 'antd';
import { kSyncFolderId } from '../../../constants/kv';
import { DataNode } from 'antd/lib/tree';
import { DefaultOptionType } from 'antd/lib/select';
import useModal from 'antd/lib/modal/useModal';
import { useToggle } from 'ahooks';
import ChangeSyncFolder, {
  bookmarksToFolderData,
} from '../components/ChangeSyncFolder';
import { generateSyncPack, mergeSameNameOrSameUrlInSyncFolder, restoreSyncPack } from '../../../actions/generateSyncPack';
import { useBookmarksTree, useSyncFolderId } from './hooks';
import FileSelectorWraper from '../components/FileSelector';

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
    dispatch({
      type: homeStateActionType.setBookmarks,
      payload: tree,
    });
  }, [tree]);



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
              同步的目录：{' '}
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
              <Space>
                <Button type="default" onClick={() => {
                  setSyncFolderId(undefined)
                }}>清除</Button>
                <Button onClick={() => {
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
                    console.log(result);
                  })
                }} disabled={!syncFolderId}>下载快照</Button>
                <FileSelectorWraper onChange={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const data = JSON.parse(reader.result as string);
                    restoreSyncPack(data)
                  };
                  reader.readAsText(file);
                  console.log(file)
                }}>
                  <Button disabled={!syncFolderId}>上传目录结构的快照</Button>
                </FileSelectorWraper>
                <Button onClick={() => {
                  mergeSameNameOrSameUrlInSyncFolder()
                }}>合并同步文件夹内的相同目录</Button>
              </Space>
            </>
          ) : (
            <Button type="primary">立即同步</Button>
          )
        }
      </Header>
      <Content>
        <Button onClick={() => {
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
            console.log(result);
          })
        }}>生成构建树</Button>
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

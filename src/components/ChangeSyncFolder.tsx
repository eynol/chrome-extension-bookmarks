import { useToggle } from 'ahooks';
import { Modal, Tree, TreeSelect } from 'antd';
import { DefaultOptionType } from 'antd/lib/select';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { useBookmarksTree } from '../hooks';

export const bookmarksToFolderData = (treeData: any[]): DefaultOptionType[] => {
  return treeData
    .map((item) => {
      const { children, title, id, url, ...rest } = item;
      if (url) {
        return undefined;
      }
      return {
        value: id,
        key: id,
        title,
        label: title,
        children: children && bookmarksToFolderData(children),
      } as DefaultOptionType;
    })
    .filter((item): item is DefaultOptionType => Boolean(item));
};

export default React.forwardRef(function ChangeSyncFolder(
  props: {
    children?: React.ReactElement;
    value?: string;
    onChange: (id: string) => void | Promise<void>;
  },
  ref
) {
  const [modalVisible, { setLeft, setRight }] = useToggle(false);
  const [folders, setFolders] = useState<DefaultOptionType[]>([]);

  const [selectedFolderId, setSelectedFolderId] = React.useState<
    string | undefined
  >(props.value);

  const tree = useBookmarksTree()
  useEffect(() => {
    if (tree?.length > 0) {
      tree[0].title = 'Bookmarks';
    }
    setFolders(bookmarksToFolderData(tree));
  }, [tree]);

  const defualtExpandedKeys = React.useMemo(() => {
    const expandedKeys: string[] = [];
    const walk = (tree: chrome.bookmarks.BookmarkTreeNode[], deepth = 2) => {
      if (deepth <= 0) {
        return;
      }
      for (const node of tree) {
        if (node.children) {
          if (!node.url) {
            expandedKeys.push(node.id);
          }
          walk(node.children, deepth - 1);
        }
      }
    }
    walk(tree)

    return expandedKeys
  }, [tree]);

  useImperativeHandle(
    ref,
    () => {
      return {
        open: setRight,
      };
    },
    []
  );

  return (
    <>
      <Modal
        open={modalVisible}
        title="设置同步文件夹"
        destroyOnClose
        okButtonProps={{
          disabled: !selectedFolderId,
        }}
        onOk={() => {
          if (selectedFolderId) {
            props.onChange(selectedFolderId);
            setLeft();
          }
        }}
        onCancel={setLeft}
      >
        <Tree treeData={folders}
          onSelect={(keys) => {
            setSelectedFolderId(keys[0] as string)
          }}
          defaultExpandedKeys={defualtExpandedKeys}
          defaultSelectedKeys={[selectedFolderId!]} showLine />
      </Modal>
      {React.Children.only(props.children) &&
        props.children &&
        React.cloneElement(props.children, {
          onClick: setRight,
        })}
    </>
  );
});

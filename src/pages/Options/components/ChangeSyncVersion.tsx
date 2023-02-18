import { useToggle } from 'ahooks';
import { Input, InputNumber, Modal, Space, TreeSelect } from 'antd';
import { DefaultOptionType } from 'antd/lib/select';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useBookmarksTree, useSyncVersion } from '../pages/hooks';


export default React.forwardRef(function ChangeSyncVersion(
  props: {
    children?: React.ReactElement;
    // value?: string;
    // onChange: (id: string) => void | Promise<void>;
  },
  ref
) {
  const [modalVisible, { setLeft, setRight }] = useToggle(false);

  const { syncVersion, setSyncVersion, remoteSyncVersion, setRemoteSyncVersion } = useSyncVersion()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputRefRemote = useRef<HTMLInputElement>(null)


  return (
    <>
      <Modal
        open={modalVisible}
        title="设置同步version"
        destroyOnClose
        onOk={() => {
          if (inputRef.current && inputRefRemote.current) {
            let value: string | number = inputRef.current.value;
            let valueRemote: string | number = inputRefRemote.current.value;
            if (typeof value === 'string') {
              value = parseInt(value)
            }
            if (typeof valueRemote === 'string') {
              valueRemote = parseInt(valueRemote)
            }
            if (isNaN(value) || isNaN(valueRemote)) {
              return
            }

            // console.log(typeof value, value)
            setSyncVersion(value)
            setRemoteSyncVersion(valueRemote)
            setLeft()
          }
        }}
        onCancel={setLeft}
      >
        <Space>
          <InputNumber style={{ width: 200, }} addonBefore="本地" defaultValue={syncVersion} min={-1} max={Number.MAX_SAFE_INTEGER} step={1} ref={inputRef} ></InputNumber>
          {'/'}
          <InputNumber style={{ width: 200, }} addonBefore="远端" defaultValue={remoteSyncVersion} min={-1} max={Number.MAX_SAFE_INTEGER} step={1} ref={inputRefRemote} ></InputNumber>
        </Space>
      </Modal>
      {React.Children.only(props.children) &&
        props.children &&
        React.cloneElement(props.children, {
          onClick: setRight,
        })}
    </>
  );
});

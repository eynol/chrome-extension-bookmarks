import { useToggle } from 'ahooks';
import { Input, InputNumber, Modal, TreeSelect } from 'antd';
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
  const [folders, setFolders] = useState<DefaultOptionType[]>([]);

  const [version, setSyncVersion] = useSyncVersion()
  const inputRef = useRef<HTMLInputElement>(null)


  return (
    <>
      <Modal
        open={modalVisible}
        title="设置同步version"
        destroyOnClose
        onOk={() => {
          if (inputRef.current) {
            let value: string | number = inputRef.current.value;
            if (typeof value === 'string') {
              value = parseInt(value)
            }
            if (isNaN(value)) {
              return
            }

            // console.log(typeof value, value)
            setSyncVersion(value)
            setLeft()
          }
        }}
        onCancel={setLeft}
      >
        <InputNumber style={{ width: 200, }} defaultValue={version} min={-1} max={Number.MAX_SAFE_INTEGER} step={1} ref={inputRef} ></InputNumber>
      </Modal>
      {React.Children.only(props.children) &&
        props.children &&
        React.cloneElement(props.children, {
          onClick: setRight,
        })}
    </>
  );
});

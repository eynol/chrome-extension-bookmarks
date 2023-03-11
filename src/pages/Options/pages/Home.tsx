import React, { useRef } from 'react';
import {
  Button, Layout, Result,
  Space, Dropdown,
  MenuProps,
  message, FloatButton,
  Descriptions,
  Tag,
  Modal,
  Input,
  InputRef
} from 'antd';
import { ExtActions, kProcessing } from '../../../constants/kv';
import { DataNode } from 'antd/lib/tree';

import ChangeSyncFolder from '../../../components/ChangeSyncFolder';
import { generateSyncPack } from '../../../actions/generateSyncPack';
import { useBackgroundState, useProcessing, useSyncFolderId, useSyncRunning, useSyncVersion } from '../../../hooks';
import FileSelectorWraper from '../../../components/FileSelector';
import { mergeSameNameOrSameUrlInSyncFolder } from '../../../actions/mergeSameNameOrSameUrlInSyncFolder';
import { DownOutlined, EditFilled, PauseCircleFilled, PlaySquareFilled } from '@ant-design/icons';
import ChangeSyncVersion from '../../../components/ChangeSyncVersion';
import { DiffResult } from '../../../components/DiffResult';
import { PageHeader } from '@ant-design/pro-layout';
const BackTop = FloatButton.BackTop;
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



export default function Home() {

  const { syncVersion, remoteSyncVersion } = useSyncVersion()
  const { syncFolderId, handleChangeSyncFolder: setSyncFolderId, syncFolderName } = useSyncFolderId()
  const running = useSyncRunning()
  const processing = useProcessing();
  const fileSelectorRef = useRef<{ click: () => void }>(null)

  const backgroundState = useBackgroundState();
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

      case 'upload-snapshot': {
        fileSelectorRef.current?.click()
        break;
      }

      case 'clean-folder-id': {
        setSyncFolderId(undefined);
        break;
      }
      case 'clean-processing': {
        await chrome.storage.local.set({ [kProcessing]: false })
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
      case 'notification-on': {
        await chrome.runtime.sendMessage({
          type: ExtActions.changeBackgroundState,
          state: {
            showNotification: true
          }
        })
        break
      }
      case 'notification-off': {
        await chrome.runtime.sendMessage({
          type: ExtActions.changeBackgroundState,
          state: {
            showNotification: false
          }
        })
        break
      }

      default: {
        break;
      }
    }
    if (key !== 'upload-snapshot') {
      message.success('done')
    }

  };

  const handleChangeRemoteHost = (remoteHost: string) => {
    const ref = React.createRef<InputRef>();
    Modal.confirm({
      title: '修改远程主机地址',
      content: <Input ref={ref} defaultValue={remoteHost} />,
      onOk: () => {
        let url = ref.current?.input?.value
        if (!url) {
          message.error('请输入远程主机地址');
          return
        }

        try {
          url = new URL(url).toString();
          chrome.runtime.sendMessage({
            type: ExtActions.changeBackgroundState,
            state: {
              syncRemoteHost: url
            }
          }, () => {
            message.success('修改成功')
          })
        } catch (e) {
          message.error('请输入正确的远程主机地址');
          return;
        }

      },
      onCancel: () => {
        console.log('cance')
      }
    })
  }

  const items: MenuProps['items'] = [
    !backgroundState.showNotification
      ? { label: '开启通知提醒', key: 'notification-on', disabled: !syncFolderId }
      : { label: '关闭通知提醒', key: 'notification-off', disabled: !syncFolderId },
    { type: 'divider' },
    { label: '合并同步文件夹内的相同目录', key: 'merge-sync-folder', disabled: !syncFolderId },
    { label: '下载快照', key: 'download-snapshot', disabled: !syncFolderId },
    { label: '上传快照', danger: true, key: 'upload-snapshot', disabled: !syncFolderId },
    { type: 'divider' },
    running
      ? { label: '暂停同步', icon: <PauseCircleFilled />, key: 'pause-sync' }
      : { label: '开始同步', icon: <PlaySquareFilled />, key: 'resume-sync' },
    { type: 'divider' },
    processing && { label: '清除处理状态', danger: true, key: 'clean-processing' }, // 菜单项务必填写 key
    { label: '清除同步目录id', danger: true, key: 'clean-folder-id' }, // 菜单项务必填写 key
  ].filter(Boolean);
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

      <PageHeader
        tags={[
          running ? <Tag key="watching" color="green">Watching</Tag> : <Tag key="paused" color="red">暂停</Tag>,
          processing && <Tag key="processing" color="blue">合并收藏夹中</Tag>,
        ]}
        ghost={false}
        // onBack={() => window.history.back()}
        title="STATUS"
        // subTitle="This is a subtitle"
        extra={[
          <Dropdown key="dropmenu" menu={{ items, onClick: onClickDropdown }}>
            <Button key="2">更多操作</Button>
          </Dropdown>,
          <Button key="1"
            onClick={() => onClickDropdown({ key: running ? 'pause-sync' : 'resume-sync' } as any)}
            icon={running ? <PauseCircleFilled /> : <PlaySquareFilled />} type="primary">
            {running
              ? <>暂停同步</> //{ label: '', icon: <PauseCircleFilled />, key: 'pause-sync' }
              : <>开始同步</>//{ label: '开始同步', icon: <PlaySquareFilled />, key: 'resume-sync' },
            }
          </Button>,
        ]}
      >
        <FileSelectorWraper
          ref={fileSelectorRef}
          onChange={(file) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const data = JSON.parse(reader.result as string);

              chrome.runtime.sendMessage({
                type: ExtActions.override,
                data: data,
              }, (resp: { done: boolean, error?: Error }) => {
                if (resp.error) {
                  message.error(resp.error?.message)
                } else {
                  message.success('merged')
                }
              })

              // restoreSyncPack(data)
            };
            reader.readAsText(file);
            console.log(file)
          }} />,
        <Descriptions size="small" column={{
          md: 3,
          sm: 1
        }}>
          <Descriptions.Item label="当前同步收藏夹">
            {syncFolderName}
            <ChangeSyncFolder
              value={syncFolderId}
              onChange={setSyncFolderId}
            >
              <EditFilled />
            </ChangeSyncFolder>
          </Descriptions.Item>
          <Descriptions.Item label="版本号" > 本地-{syncVersion} / 服务器-{remoteSyncVersion} <ChangeSyncVersion ><EditFilled /></ChangeSyncVersion> </Descriptions.Item>
          <Descriptions.Item label="发现最新版本号">{remoteSyncVersion}</Descriptions.Item>
          <Descriptions.Item label="服务器地址">{backgroundState.syncRemoteHost} <EditFilled onClick={() => handleChangeRemoteHost(backgroundState.syncRemoteHost)} /></Descriptions.Item>
          {/* <Descriptions.Item label="Effective Time">2017-10-10</Descriptions.Item>
            <Descriptions.Item label="Remarks">
              Gonghu Road, Xihu District, Hangzhou, Zhejiang, China
            </Descriptions.Item> */}
        </Descriptions>
      </PageHeader>
      <DiffResult></DiffResult>
      <BackTop />


    </Layout>
  );
}

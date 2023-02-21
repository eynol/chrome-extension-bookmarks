import { Alert, Button, Card, Col, Descriptions, Popconfirm, Result, Row, Space, Tag, Tree, TreeProps } from "antd";
import { PageHeader } from '@ant-design/pro-layout'
import { DataNode } from "antd/lib/tree";
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMarkedTree } from "../../../actions/restoreSyncPack";
import { EditedChromeNode } from "../../../interfaces";
import { useConfilictStatus, useProcessing, useSyncVersion } from "../pages/hooks";
import { FolderOutlined } from "@ant-design/icons";
import { ExtActions, kSyncVersionId } from "../../../constants/kv";


const redStyle: CSSProperties = {
    color: 'red'
}
const greenStyle: CSSProperties = {
    color: 'green',
}
const nodeTreeTitleRender = (node: EditedChromeNode) => {
    return <span style={node.created ? greenStyle : node.removed ? redStyle : undefined}>{node.title}</span>
}
export const DiffResult: React.FC = () => {

    const { remoteSyncVersion } = useSyncVersion()
    const processing = useProcessing()
    const { isSameVersion, isEasyMerge, isConflict, isRemoteNeedUpload, isProcessing, originalSyncPack, markedTree, updateMarkedTree } = useConfilictStatus()
    const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
    const forceUpdateCountRef = useRef(0)
    const markedTreeClone = useMemo(() => JSON.parse(JSON.stringify(markedTree ?? {})), [markedTree]);
    const [localFilterdTreeData, idMapRelation] = useMemo(() => {
        const idMap = new Map<string, EditedChromeNode>();
        if (!markedTree) return [[], idMap];
        const transform = (node: EditedChromeNode, paths: string[] = [], index: number): undefined | DataNode & {
            children?: DataNode[];
        } => {
            const currentPath = [...paths, node.title];

            let childrend: DataNode[] = [];
            if (node.children) {
                childrend = node.children.map((child, index) => {
                    const childNode = transform(child, currentPath, index);
                    if (childNode) {
                        return childNode;
                    }
                    return null;
                }).filter((x): x is DataNode => Boolean(x));
            }
            const hasChildren = childrend.length > 0;
            const isKeepedLeef = node.created || node.removed;
            if (hasChildren || isKeepedLeef) {
                let id = node.id;
                idMap.set(id, node);
                return {
                    title: nodeTreeTitleRender(node),
                    // id: node.id,
                    icon: !!node.url ? undefined : <FolderOutlined />,
                    key: node.id,
                    children: childrend,

                    // value: node.id,
                };
            } else {
                return undefined
            }
        }
        return [[transform(markedTreeClone, [], 0)].filter((x): x is DataNode => !!x), idMap] as const
    }, [markedTree])

    const regenerateMarkedTree = useCallback(async () => {
        setSelectedKeys([]);
        forceUpdateCountRef.current += 1;
        await chrome.runtime.sendMessage(ExtActions.regenerateMarkedTree)
    }, [])

    const treeKey = useMemo(() => Date.now().toString(), [localFilterdTreeData, forceUpdateCountRef.current])
    const defaultExpandedKeys = useMemo(() => {
        const expandedKeys: string[] = [];
        const transform = (list: { key: string | number, children?: any[] }[], level: number) => {
            if (level <= 0) {
                return
            }
            list.forEach(node => {
                expandedKeys.push(node.key as string)
                if (node.children?.length ?? 0 > 0) {
                    transform(node.children ?? [], level - 1)
                }
            })
        }
        transform(localFilterdTreeData, 1);
        return expandedKeys
    }, [localFilterdTreeData])

    console.log(localFilterdTreeData, markedTree, selectedKeys, idMapRelation, markedTreeClone)
    const isReady = isRemoteNeedUpload || isSameVersion || isEasyMerge || (isConflict && originalSyncPack && markedTree);
    useEffect(() => {
        if (originalSyncPack && !markedTree) {
            // init modifiedRecord
            getMarkedTree(originalSyncPack).then((record) => {
                updateMarkedTree(record)
            })
        }
    }, [originalSyncPack, markedTree])

    useEffect(() => {
        if (markedTree) {
            console.log('markedTree', markedTree)
        }
    }, [markedTree])

    const confirmResolveConflict = useCallback(() => {
        if (selectedKeys.length === 0) {
            chrome.storage.sync.set({ [kSyncVersionId]: remoteSyncVersion })
            chrome.runtime.sendMessage(ExtActions.walkmarkedTree)
        } else {
            alert('todo')
        }

    }, [selectedKeys])

    if (!isReady) {
        return <Result title="加载中" status={'info'} subTitle="请稍后"></Result>
    }
    if (isSameVersion) {
        return <Result title="无差异" status={'success'} subTitle="无需做任何事情"></Result>
    }
    if (isEasyMerge) {
        return <Result title="简单合并" status={"info"} subTitle={isProcessing ? "处理中" : "暂未开始处理"}></Result>
    }
    if (isRemoteNeedUpload) {
        return <Result title="本地比远程领先了" status={"info"} subTitle={'需要上传至远端'}></Result>
    }
    if (isConflict) {

        return (
            <Card title="解决冲突" loading={processing}>
                <Row gutter={[8, 6]}>
                    <Col span={24}>
                        <PageHeader
                            // tags={isConflict ? <Tag color="green">运行中</Tag> : <Tag color="red">暂停</Tag>}
                            ghost={true}
                            // onBack={() => window.history.back()}
                            title="解决冲突"
                            subTitle="Resolve Conflict"
                            extra={[
                                // <Dropdown menu={{ items, onClick: onClickDropdown }}>
                                //   <a onClick={e => e.preventDefault()}>
                                //     <Space>
                                //       更多操作
                                //       <DownOutlined />
                                //     </Space>
                                //   </a>
                                // </Dropdown>,
                                // <Button key="2">Operation</Button>,
                                // <Button key="1" type="primary">
                                //     Primary
                                // </Button>,
                            ]}
                        >

                            <Descriptions size="small" column={3}>

                                {/* <Descriptions.Item label="版本号" > 本地-{syncVersion} / 服务器-{remoteSyncVersion} <ChangeSyncVersion ><EditFilled /></ChangeSyncVersion> </Descriptions.Item> */}
                                {/* <Descriptions.Item label="发现最新版本号">{remoteSyncVersion}</Descriptions.Item> */}
                                {/* <Descriptions.Item label="Effective Time">2017-10-10</Descriptions.Item>
            <Descriptions.Item label="Remarks">
              Gonghu Road, Xihu District, Hangzhou, Zhejiang, China
            </Descriptions.Item> */}
                            </Descriptions>
                        </PageHeader>
                    </Col>
                    <Col span={24}>
                        <Alert banner type="info" description={
                            <span> 下方<span style={{ color: 'red' }}>红色的文本是即将删除的</span>，勾选以后，将不会删除；<span style={{ color: 'green' }}>绿色文本是即将创建的</span>，勾选以后将不会创建。</span>}></Alert>
                    </Col>

                    <Col span={24}>
                        <Tree showLine showIcon

                            key={treeKey}
                            selectedKeys={selectedKeys}
                            defaultSelectedKeys={selectedKeys}
                            defaultExpandedKeys={defaultExpandedKeys}
                            style={{ height: '50vh', overflow: 'auto' }}
                            onCheck={(keys) => {
                                setSelectedKeys(keys as string[])
                            }}
                            // onSelect={(keys) => {
                            //     setSelectedKeys(keys as string[])
                            // }}
                            checkable
                            treeData={localFilterdTreeData} />
                    </Col>
                    <Col span={24}>
                        <Alert type="warning" description={
                            selectedKeys.length > 0 ? <span>
                                总结：以上变更中，共 {selectedKeys.length} 项不会执行：
                            </span> : '总结：以上变更将会全部生效'
                        }></Alert>

                        <Space style={{ marginTop: 8 }}>
                            <Button onClick={regenerateMarkedTree}>重置</Button>
                            <Popconfirm
                                title="再次确认"
                                description={selectedKeys.length > 0 ? `共${selectedKeys.length}项变更将不会执行，其他变更将全部执行` : '以上变更将全部执行'}
                                onConfirm={confirmResolveConflict}
                                // onCancel={cancel}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button type="primary">确认变更</Button>
                            </Popconfirm>
                        </Space>
                    </Col>

                </Row>
            </Card >
        )
    }

    return <div>未知</div>


}
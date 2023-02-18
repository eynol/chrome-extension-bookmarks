import { Button, Result, Space, Tree, TreeProps } from "antd";
import { DataNode } from "antd/lib/tree";
import React, { CSSProperties, useEffect, useMemo } from "react";
import { getMarkedTree } from "../../../actions/restoreSyncPack";
import { EditedChromeNode } from "../../../interfaces";
import { useConfilictStatus } from "../pages/hooks";


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
    const { isSameVersion, isEasyMerge, isConflict, isRemoteNeedUpload, isProcessing, originalSyncPack, markedTree, updateMarkedTree } = useConfilictStatus()
    const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
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
        return <div>
            <Space direction="vertical">

                <Space>
                    <Button type="ghost">重新生成节点树</Button>
                </Space>
                <Tree showLine showIcon selectedKeys={selectedKeys}
                    onCheck={(keys) => {
                        setSelectedKeys(keys as string[])
                    }}
                    onSelect={(keys) => {
                        setSelectedKeys(keys as string[])
                    }}
                    checkable
                    treeData={localFilterdTreeData} />
            </Space>
        </div>
    }

    return <div>未知</div>


}
import { kSyncFolderId, SyncPackNode } from "../constants/kv";
import { isSameFolderByChildren } from "./isSameFolderByChildren";
import { mergeTwoTreeMark } from './mergeTwoTree'
import { singleTreeWalker } from './markTreeWalker'
import { EditedChromeNode } from "../interfaces";

/** 还原同步目录目录中的资源 */
export const restoreSyncPack = async (syncPack: SyncPackNode) => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)
    const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(syncFolderId);
    const root = bookmarks[0];
    const markedTree = mergeTwoTreeMark(syncPack, root)
    await singleTreeWalker(markedTree, {
        async created({ currentNode, parent, order }) {
            const createdNode = await chrome.bookmarks.create({
                parentId: parent?.id,
                index: order,
                title: currentNode.title,
                url: currentNode.url
            })
            return createdNode;
        },
        removed: async function ({ currentNode }): Promise<EditedChromeNode> {
            if (currentNode.url) {
                await chrome.bookmarks.remove(currentNode.id!)
            } else {
                await chrome.bookmarks.removeTree(currentNode.id!)
            }
            return currentNode;
        },
        ordered: async function ({ currentNode, parent, order }): Promise<EditedChromeNode> {
            return await chrome.bookmarks.move(currentNode.id!, { parentId: parent!.id, index: order })
        }
    }, [])
    // compareChildren(syncPack, root);
    // walk(syncPack, root);
}

/** 只有这样的 */
const compareChildren = async (syncNode: SyncPackNode, chromeNode: chrome.bookmarks.BookmarkTreeNode) => {
    const { children: syncChildren = [] } = syncNode;
    const { children: chromeChildren = [] } = chromeNode;

    const syncChildrenIsEmpty = syncChildren.length === 0;
    const chromeChildrenIsEmpty = chromeChildren.length === 0;
    if (syncChildrenIsEmpty && !chromeChildrenIsEmpty) {
        // 同步的目录下没有这个节点，但是chrome的目录下有这个节点，删除
        console.log('场景1，', syncNode.title)
        await Promise.all(chromeChildren.map(child => {
            child.url
                ? chrome.bookmarks.remove(child.id)
                : chrome.bookmarks.removeTree(child.id)
        }));
        return;
    };
    if (syncChildrenIsEmpty && chromeChildrenIsEmpty) {
        // 两个目录都是空的，直接返回
        console.log('场景2，', syncNode.title)
        return;
    }
    if (!syncChildrenIsEmpty && chromeChildrenIsEmpty) {
        // 同步的目录下有节点，但是chrome的目录下没有节点，递归创建
        console.log('场景3，', syncNode.title)
        await Promise.all(syncChildren.map(async ({ title, url, children }) => {
            const newNode = await chrome.bookmarks.create({ parentId: chromeNode.id, title, url })
            if (children) {
                // 递归去创建节点
                await Promise.all(children.map(child => compareChildren(child, newNode)));
            }
        }));
        return;
    }
    if (!syncChildrenIsEmpty && !chromeChildrenIsEmpty) {
        // 两边都有节点，做 diff 比较
        let sameNodeIndex = Array(syncChildren.length);
        //1. 先找出子节点可能在对面的索引
        syncChildren.forEach((node, syncArrIndex) => {
            const { title, url } = node;
            const index = chromeChildren.findIndex(child => child.title === title && child.url === url);
            // 这里对比了相同的url和标题
            // 文件夹没有url属性；只有文件夹相同的会得到索引，会出现文件夹名字相同的情况
            // URL链接 可能会由于改名字和url链接的情况出现。
            if (index !== -1) {
                // 节点全等，直接推进去
                // 三类： 文件夹名字相同的，文件夹重复的，URL页面完全匹配的
                sameNodeIndex[syncArrIndex] = index;
                return
            }
            // 1.文件夹名字不同的，这种情况还需要继续查找
            if (!url) {
                const indexTry = chromeChildren.findIndex(child => isSameFolderByChildren(node, child))
                sameNodeIndex[syncArrIndex] = indexTry;
                return
            } else {
                // 2.URL名字或者链接不重复的，由于新建和删除一个链接的成本不大，所以我们不对超链接的改动做检测
                sameNodeIndex[syncArrIndex] = -1;
                return
            }
        })
        console.log('场景4，', sameNodeIndex, syncChildren)
        // 2.这里面可能有相似的两个节点，所以需要找出哪些节点重复了
        const maybeSameNode = new Map();
        sameNodeIndex.forEach((chromeArrIndex, syncArrIndex) => {
            if (chromeArrIndex > -1) {
                if (!maybeSameNode.has(chromeArrIndex)) {
                    maybeSameNode.set(chromeArrIndex, []);
                }
                const sameNodeGroup = maybeSameNode.get(chromeArrIndex);
                sameNodeGroup.push(syncArrIndex);
            }
        })
        const sameNodeGroup = Array.from(maybeSameNode.entries()).filter(([_, groupSyncArrIndex]) => {
            groupSyncArrIndex.length > 1
        })

        console.log(sameNodeGroup)
    }
}

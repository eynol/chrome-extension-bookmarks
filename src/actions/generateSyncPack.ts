import { kSyncFolderId } from "../constants/kv"
import { decryptMessage, encryptMessage } from "./aesUtils";



export interface SyncPackNode {
    id: number;
    title: string;
    url?: string;
    children?: SyncPackNode[];
}
export const generateSyncPack = async () => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)
    const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(syncFolderId);

    let id = 0;
    const walk = (node: chrome.bookmarks.BookmarkTreeNode) => {
        const { title, url, children } = node;
        const result: SyncPackNode = { id: id++, title, url };
        if (children) {
            result.children = children.map(walk);
        }
        return result;
    }
    // ignore the root node
    const syncPack = walk(bookmarks[0]);


    return syncPack

}

export const mergeSameNameOrSameUrlInSyncFolder = async () => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)


    const walk = async (idList: string[]) => {

        for await (let id of idList) {
            const [node]: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(id);
            const { children } = node;
            if (children) {
                const urlNodeToDelete: string[] = [];
                const bookmarksToMerge = new Map<chrome.bookmarks.BookmarkTreeNode, chrome.bookmarks.BookmarkTreeNode>();

                const remainChilren = children.filter((node, index) => {
                    // 不可能为 -1
                    const mayBeSameIndex = children.findIndex(x => {
                        if (node.url) {
                            // 是超链接,只要标题或者URL一致就认为是同一个
                            return x.url === node.url

                        }
                        return x.title === node.title
                    });
                    // 自己找自己，一定会有的
                    const hasDuplicated = mayBeSameIndex < index;
                    if (hasDuplicated) {
                        // 如果找到了比自己小的节点的索引，说明需要将自己删除或者合并进前一个节点中
                        if (node.url) {
                            // 是相似的页面链接
                            urlNodeToDelete.push(node.id)
                            // chrome.bookmarks.remove(node.id);
                        } else {
                            // 是文件夹合并
                            bookmarksToMerge.set(node, children[mayBeSameIndex])
                        }

                    }
                    // 重复的节点不需要了。
                    return !hasDuplicated
                })
                await Promise.all(urlNodeToDelete.map(id => chrome.bookmarks.remove(id)))
                await Promise.all(Array.from(bookmarksToMerge.entries()).map(([source, target]) => {
                    return mergeTwoChromeBookMarkFolders(source, target);
                }))

                // 继续递归
                console.log('继续递归', remainChilren.map(x => x.title));
                await walk(remainChilren.map(node => node.id));
            }
        }
    }
    await walk([syncFolderId]);

}

// 合并两个chrome书签目录，只处理本层级的，不深入子层级
export const mergeTwoChromeBookMarkFolders = async (source: chrome.bookmarks.BookmarkTreeNode, target: chrome.bookmarks.BookmarkTreeNode) => {
    if (source.url || target.url) {
        return
    }
    if (source.children && source.children.length) {
        const tasks = source.children.map(async sourceSingleChild => {
            if (!target.children) {
                return chrome.bookmarks.move(sourceSingleChild.id, { parentId: target.id })
            }
            if (sourceSingleChild.url) {
                // 页面链接
                if (target.children.some(x => x.url === sourceSingleChild.url)) {
                    // 对面已经有这个页面链接了，
                    return chrome.bookmarks.remove(sourceSingleChild.id)
                } else {
                    return chrome.bookmarks.move(sourceSingleChild.id, { parentId: target.id })
                }
            } else {
                // 文件夹类型
                const targetSameFolder = target.children.find(x => x.title === sourceSingleChild.title);

                if (targetSameFolder) {
                    console.log('相同的目录准备合并', targetSameFolder.title)
                    // 这里不做深度递归，只处理本层的
                    return Promise.all(sourceSingleChild.children?.map(x => chrome.bookmarks.move(x.id, { parentId: targetSameFolder.id })) ?? []).then(
                        // 对面已经有这个页面链接了，
                        () => chrome.bookmarks.remove(sourceSingleChild.id)
                    )
                    // return mergeTwoChromeBookMarkFolders(node, targetSameFolder)
                } else {
                    console.log('没有找到相同的文件夹，就直接移动过去', sourceSingleChild.title);
                    // 没有找到相同的文件夹，就直接移动过去
                    return chrome.bookmarks.move(sourceSingleChild.id, { parentId: target.id })
                }

            }
        })
        await Promise.all(tasks);
    }
    return chrome.bookmarks.remove(source.id);
}

export const restoreSyncPack = async (syncPack: SyncPackNode) => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)
    const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(syncFolderId);
    const root = bookmarks[0];
    compareChildren(syncPack, root);
    // walk(syncPack, root);
}

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

function isSameFolderByChildren(syncNode: SyncPackNode, chromeNode: chrome.bookmarks.BookmarkTreeNode) {
    //
    const { children: syncChildren = [] } = syncNode;
    const { children: chromeChildren = [] } = chromeNode;

    const syncChildrenIsEmpty = syncChildren.length === 0;
    const chromeChildrenIsEmpty = chromeChildren.length === 0;

    if (syncChildrenIsEmpty || chromeChildrenIsEmpty) {
        return false;
    }

    const sameCount = syncChildren.reduce((count, node) => {
        const existInAnoterGroup = chromeChildren.some(anotherNode => {
            if (node.url) {
                // 是超链接
                return node.url === anotherNode.url || node.title === node.title
            } else {
                return node.title === node.title;
            }
        });
        if (existInAnoterGroup) {
            count += 1;
        }
        return count;
    }, 0)

    return sameCount / syncChildren.length > 0.5// 只要概率大于0.5就算作相似
}
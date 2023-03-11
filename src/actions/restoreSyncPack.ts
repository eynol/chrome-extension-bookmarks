import { kSyncFolderId, SyncPackNode } from "../constants/kv";
import { isSameFolderByChildren } from "./isSameFolderByChildren";
import { mergeTwoTreeMark } from './mergeTwoTree'
import { singleTreeWalker } from './markTreeWalker'
import { EditedChromeNode } from "../interfaces";
const clone = (a: any) => JSON.parse(JSON.stringify(a));

export const getMarkedTree = async (syncPack: SyncPackNode, bookmarksLocal?: chrome.bookmarks.BookmarkTreeNode[]) => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)
    const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = bookmarksLocal ?? await chrome.bookmarks.getSubTree(syncFolderId);
    const root = bookmarks[0];
    const markedTree = mergeTwoTreeMark(clone(syncPack), clone(root))
    return markedTree;
}


export const walkMarkedTree = async (markedTree: SyncPackNode) => {
    await singleTreeWalker(markedTree, {
        created: async ({ currentNode, parent, order }) => {
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
        },
        renamed: async function ({ currentNode, parent, order }): Promise<EditedChromeNode> {
            return await chrome.bookmarks.update(currentNode.id!, { title: currentNode.title })
        }
    }, [])
}
/** 还原同步目录目录中的资源,用于直接覆盖值 */
export const restoreSyncPack = async (syncPack: SyncPackNode) => {
    const markedTree = await getMarkedTree(syncPack)
    await walkMarkedTree(markedTree)
    // compareChildren(syncPack, root);
    // walk(syncPack, root);
}

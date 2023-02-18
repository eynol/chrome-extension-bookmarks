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

import * as chrome from "webextension-polyfill";

import { kSyncFolderId, SyncPackNode } from "../constants/kv"
import { decryptMessage, encryptMessage } from "./aesUtils";

export const walkThroughNativeStructure = (node: chrome.Bookmarks.BookmarkTreeNode) => {
    const { title, url, id: oldId, children } = node;
    const result: SyncPackNode = { id: '_' + oldId, title, url };
    if (children) {
        result.children = children.map(walkThroughNativeStructure);
    }
    return result;
}
export const generateSyncPack = async () => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)
    const bookmarks: chrome.Bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(syncFolderId);

    // ignore the root node
    const syncPack = walkThroughNativeStructure(bookmarks[0]);
    return syncPack

}


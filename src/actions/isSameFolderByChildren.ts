import * as chrome from "webextension-polyfill";

import { SyncPackNode } from "../constants/kv";

/**  这两个文件夹是否是相同的 */
export function isSameFolderByChildren(syncNode: SyncPackNode, chromeNode: chrome.Bookmarks.BookmarkTreeNode) {
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
import { EditedChromeNode } from "../interfaces";

export const mergeJsonTree = (chromeTree: chrome.bookmarks.BookmarkTreeNode) => {
    const { id, title, url, index, children, parentId } = chromeTree;
    const result: EditedChromeNode = { id, title, url, index, parentId };
    if (children) {
        result.children = children.map(mergeJsonTree);
    }
    return result;
}
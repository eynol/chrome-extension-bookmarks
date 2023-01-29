

export interface SyncPackNode {
    id: string;
    title: string;
    url?: string;
    children?: SyncPackNode[];
}
export type EditedChromeNode = chrome.bookmarks.BookmarkTreeNode & {
    removed?: boolean;
    created?: boolean;
}
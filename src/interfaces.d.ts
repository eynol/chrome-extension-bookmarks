

export interface SyncPackNode {
    id: string;
    title: string;
    url?: string;
    children?: SyncPackNode[];
}
export type EditedChromeNode = Omit<chrome.bookmarks.BookmarkTreeNode, 'children'> & {
    children?: EditedChromeNode[];
    removed?: boolean;
    ordered?: boolean;
    renamed?: boolean;
    created?: boolean;
}
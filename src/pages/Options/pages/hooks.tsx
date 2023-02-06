import { useEffect, useState, useCallback } from "react"
import { kSyncFolderId } from "../../../constants/kv";

export const useBookmarksTree = () => {
    const [tree, setTree] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);

    const getTree = useCallback(() => {
        chrome.bookmarks.getTree((tree) => {
            setTree(tree)
        })
    }, []);
    // 第一次初始化时获取书签树
    useEffect(getTree, [])
    useEffect(() => {
        // 监听书签树变化
        chrome.bookmarks.onCreated.addListener(getTree)
        chrome.bookmarks.onMoved.addListener(getTree)
        chrome.bookmarks.onChanged.addListener(getTree)
        chrome.bookmarks.onRemoved.addListener(getTree)

        return () => {
            chrome.bookmarks.onCreated.removeListener(getTree)
            chrome.bookmarks.onMoved.removeListener(getTree)
            chrome.bookmarks.onChanged.removeListener(getTree)
            chrome.bookmarks.onRemoved.removeListener(getTree)
        }
    }, [])

    return tree
}

export const useSyncFolderId = () => {
    const [syncFolderId, setSyncFolderId] = useState<string | undefined>();
    useEffect(() => {
        chrome.storage.sync.get(kSyncFolderId, (result) => {
            setSyncFolderId(result[kSyncFolderId])
            // dispatch({
            //   type: homeStateActionType.setSyncFolderId,
            //   payload: result[kSyncFolderId],
            // });
        });

        const listener = (changes: { [key: string]: chrome.storage.StorageChange; }, areaName: "sync" | "local" | "managed") => {
            if (areaName === 'sync' && kSyncFolderId in changes) {
                setSyncFolderId(changes[kSyncFolderId].newValue)
            }
        }
        chrome.storage.onChanged.addListener(listener);
        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, [])

    const handleChangeSyncFolder = useCallback(async (id: string | undefined) => {
        await chrome.storage.sync.set({ [kSyncFolderId]: id });
        setSyncFolderId(id)
    }, [])

    return [syncFolderId, handleChangeSyncFolder] as const;
}
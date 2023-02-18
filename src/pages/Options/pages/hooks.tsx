import { useEffect, useState, useCallback, useRef } from "react"
import { kProcessing, kSyncFolderId, kSyncVersionId } from "../../../constants/kv";

export const useSyncVersion = () => {
    const [syncVersion, setSyncVersionRaw] = useState(-1);

    const setSyncVersion = useCallback((version: number) => {
        chrome.storage.sync.set({ [kSyncVersionId]: version })
    }, [])

    useEffect(() => {
        chrome.storage.sync.get(kSyncVersionId, (result) => {
            setSyncVersionRaw(result[kSyncVersionId] ?? -1)
        })
        const handler = (changes: {
            [key: string]: chrome.storage.StorageChange;
        }, areaName: "sync" | "local" | "managed") => {
            if (kSyncVersionId in changes) {
                setSyncVersionRaw(changes[kSyncVersionId].newValue)
            }
        }
        chrome.storage.onChanged.addListener(handler)
        return () => {
            chrome.storage.onChanged.removeListener(handler)
        }
    }, [])

    return [syncVersion, setSyncVersion] as const;
}

export const useProcessing = () => {
    const [processing, setProcessing] = useState(false);
    useEffect(() => {
        chrome.storage.local.get(kProcessing, (result) => {
            setProcessing(result[kProcessing])
        })

        const handler = (changes: {
            [key: string]: chrome.storage.StorageChange;
        }, areaName: "sync" | "local" | "managed") => {
            if (kProcessing in changes) {
                setProcessing(changes[kProcessing].newValue)
            }
        }
        chrome.storage.onChanged.addListener(handler)
        return () => {
            chrome.storage.onChanged.removeListener(handler)
        }
    }, [])

    return processing;
}
export const useBookmarksTree = () => {
    const [tree, setTree] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
    const processing = useProcessing();
    const getTree = useCallback(() => {
        /** if processing ,return do nothing */
        if (processing) {
            return;
        }
        chrome.bookmarks.getTree((tree) => {
            setTree(tree)
        })
    }, [processing]);
    // 第一次初始化时获取书签树
    useEffect(getTree, [processing])
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
    }, [processing])

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
import { useEffect, useState, useCallback, useRef } from "react"
import { ExtActions, kMarkedTreeForReview, kOriginalSyncPack, kProcessing, kSyncFolderId, kSyncRemoteVersionId, kSyncVersionId } from "../../../constants/kv";
import { EditedChromeNode } from "../../../interfaces";

type KeysToObject<T extends string> = {
    [key in T]?: any
}
export const useChromeStorage: <T extends string>(areaName: 'local' | 'sync', keys: T[]) => readonly [KeysToObject<T>, (newValue: KeysToObject<T>) => Promise<void>] = <T extends string>(areaName: 'local' | 'sync', keys: T[]) => {
    const [state, setState] = useState(() => {
        const init: Record<string, any> = {};
        keys.forEach(k => init[k] = undefined)
        return init
    });
    const updateStorage = useCallback(async (newValue: Record<string, any>,) => {
        await chrome.storage[areaName].set(newValue)
        setState(origin => ({
            ...origin,
            ...newValue
        }))
    }, [])

    useEffect(() => {

        if ((keys)?.length > 0) {
            chrome.storage[areaName].get(keys).then(r1 => {
                setState(origin => ({
                    ...origin,
                    ...r1,
                }))
            })
        }


        const handler = (changes: {
            [key: string]: chrome.storage.StorageChange;
        }, areaName: "sync" | "local" | "managed") => {
            if (areaName === 'managed') {
                return
            }
            if (keys?.length > 0) {
                const gatherd = keys.reduce((ret, key) => {
                    if (key in changes) {
                        ret[key] = changes[key].newValue
                    }
                    return ret
                }, {} as Record<string, any>)
                setState(origin => ({ ...origin, ...gatherd }))
            }

        }
        chrome.storage.onChanged.addListener(handler)
        return () => {
            chrome.storage.onChanged.removeListener(handler)
        }
    }, [])

    return [state, updateStorage] as const
}

export const useSyncVersion = () => {

    const [state, setState] = useChromeStorage('sync', [kSyncVersionId, kSyncRemoteVersionId])

    const syncVersion = state[kSyncVersionId];
    const remoteSyncVersion = state[kSyncRemoteVersionId];
    const setSyncVersion = useCallback((version: number) => {
        setState({ [kSyncVersionId]: version })
    }, [])
    const setRemoteSyncVersion = useCallback((version: number) => {
        setState({ [kSyncRemoteVersionId]: version })
    }, [])


    return { syncVersion, setSyncVersion, remoteSyncVersion, setRemoteSyncVersion };
}

export const useProcessing = () => {
    const [state] = useChromeStorage('local', [kProcessing])
    return state[kProcessing];
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

    const [state, setState] = useChromeStorage('sync', [kSyncFolderId])
    const syncFolderId = state[kSyncFolderId];

    const [syncFolderName, setSyncFolderName] = useState<string>()

    useEffect(() => {
        if (syncFolderId) {
            chrome.bookmarks.get(syncFolderId, (result) => {
                setSyncFolderName(result[0].title)
            })
        }
    }, [syncFolderId])

    const handleChangeSyncFolder = useCallback(async (id: string | undefined) => {
        await setState({ [kSyncFolderId]: id })
    }, [])

    return { syncFolderId, syncFolderName, handleChangeSyncFolder, } as const;
};

export const useSyncRunning = () => {
    const [running, setRunning] = useState(false);
    useEffect(() => {
        const listener = async () => {
            chrome.runtime.sendMessage(ExtActions.isInterlvalExist, (resp: { running: boolean }) => {
                setRunning(resp.running)
            })
        }
        listener();
        const timmer = setInterval(listener, 1000)
        return () => {
            clearInterval(timmer);
        }
    }, [])

    return running
}

export const useConfilictStatus = () => {
    const [syncState] = useChromeStorage('sync', [kSyncVersionId, kSyncRemoteVersionId,])

    const [localState, setState] = useChromeStorage('local', [kOriginalSyncPack, kMarkedTreeForReview, kProcessing])

    const updateMarkedTree = useCallback(async (record: EditedChromeNode) => {
        await setState({ [kMarkedTreeForReview]: record })
    }, [])

    const isSameVersion = syncState[kSyncRemoteVersionId] === syncState[kSyncVersionId]
    const isEasyMerge = syncState[kSyncRemoteVersionId] - syncState[kSyncVersionId] === 1
    const isConflict = syncState[kSyncRemoteVersionId] - syncState[kSyncVersionId] > 1
    const isRemoteNeedUpload = syncState[kSyncVersionId] - syncState[kSyncRemoteVersionId] > 0
    const {
        [kProcessing]: isProcessing = false,
        [kOriginalSyncPack]: originalSyncPack,
        [kMarkedTreeForReview]: markedTree
    } = localState;

    return {
        isSameVersion,
        isEasyMerge,
        isConflict,
        isProcessing,
        isRemoteNeedUpload,

        originalSyncPack,
        markedTree,
        updateMarkedTree,
    }

}
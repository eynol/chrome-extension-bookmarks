import { useEffect, useState, useCallback, useRef } from "react"
import { getMarkedTree } from "./actions/restoreSyncPack";
import { ExtActions, kOriginalSyncPack, kProcessing, kSyncFolderId, kSyncRemoteVersionId, kSyncVersionId } from "./constants/kv";
import { EditedChromeNode } from "./interfaces";

interface BackgroundState {
    processing?: boolean,
    syncFolderId?: boolean,
    gatherTimmer?: number | null,
    showNotification: boolean,
    syncRemoteHost: string
}



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

    const [state, setState] = useChromeStorage('sync', [kSyncVersionId,])
    const [state2, setState2] = useChromeStorage('local', [kSyncRemoteVersionId])

    const syncVersion = state[kSyncVersionId];
    const remoteSyncVersion = state2[kSyncRemoteVersionId];

    const setSyncVersion = useCallback((version: number) => {
        setState({ [kSyncVersionId]: version })
    }, [])
    const setRemoteSyncVersion = useCallback((version: number) => {
        setState2({ [kSyncRemoteVersionId]: version })
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

const isSameTree = (a: chrome.bookmarks.BookmarkTreeNode | undefined, b: chrome.bookmarks.BookmarkTreeNode | undefined): boolean => {
    if (!a && !b) {
        return true
    }
    if (!a || !b) {
        return false
    }
    if (a.title !== b.title || a.url !== b.url) {
        return false
    }
    if ((a.children ?? []).length !== (b.children ?? []).length) {
        return false
    }
    if (a.children && b.children) {
        return a.children.every((c, i) => isSameTree(c, b.children![i]))
    }
    return true

}

export const useSyncFolderTree = () => {
    const [tree, setTree] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);
    const processing = useProcessing();
    const { syncFolderId } = useSyncFolderId();
    const syncFolderIdRef = useRef(syncFolderId);

    syncFolderIdRef.current = syncFolderId;

    const getTree = useCallback(() => {
        /** if processing ,return do nothing */
        if (processing) {
            return;
        }
        if (syncFolderId) {
            chrome.bookmarks.getSubTree(syncFolderId, (tree) => {
                if (syncFolderIdRef.current === syncFolderId) {
                    setTree(OriginTree => {
                        console.log('update ,sync folder tree id %s', syncFolderId, OriginTree)
                        if (isSameTree(OriginTree[0], tree[0])) {
                            console.log('isSame tree')
                            return OriginTree
                        }
                        return tree
                    })
                }
            })
        }

    }, [processing, syncFolderId]);
    // 第一次初始化时获取书签树
    useEffect(getTree, [processing, syncFolderId])
    useEffect(() => {
        // 监听书签树变化
        chrome.bookmarks.onCreated.addListener(getTree)
        chrome.bookmarks.onMoved.addListener(getTree)
        chrome.bookmarks.onChanged.addListener(getTree)
        chrome.bookmarks.onChildrenReordered.addListener(getTree)
        chrome.bookmarks.onRemoved.addListener(getTree)

        return () => {
            chrome.bookmarks.onCreated.removeListener(getTree)
            chrome.bookmarks.onMoved.removeListener(getTree)
            chrome.bookmarks.onChanged.removeListener(getTree)
            chrome.bookmarks.onChildrenReordered.removeListener(getTree)
            chrome.bookmarks.onRemoved.removeListener(getTree)
        }
    }, [processing, getTree, syncFolderId])

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
export const useBackgroundState = () => {
    const [backgroundState, setBackgroundState] = useState<BackgroundState>({
        showNotification: false,
        syncRemoteHost: '',
    });
    useEffect(() => {
        const listener = async () => {
            chrome.runtime.sendMessage(ExtActions.getBackgroundState, (resp: BackgroundState) => {
                setBackgroundState(resp)
            })
        }
        listener();
        const timmer = setInterval(listener, 1000)
        return () => {
            clearInterval(timmer);
        }
    }, [])

    return backgroundState
}

export const useConfilictStatus = () => {
    const [{ [kSyncVersionId]: syncVersionId }] = useChromeStorage('sync', [kSyncVersionId])

    const [
        {
            [kProcessing]: isProcessing = false,
            [kOriginalSyncPack]: originalSyncPack,
            [kSyncRemoteVersionId]: syncRemoteVersionId
        },
        setState
    ] = useChromeStorage('local', [
        kOriginalSyncPack, kProcessing, kSyncRemoteVersionId
    ])


    const [markedTree, setMarkedTree] = useState<EditedChromeNode>()
    const tree = useSyncFolderTree()
    const { syncFolderId } = useSyncFolderId();

    useEffect(() => {
        let canceld = false;
        if (syncFolderId && tree && tree.length && originalSyncPack) {
            getMarkedTree(originalSyncPack, tree).then(markedTreeNext => {
                console.log('update marked tree', markedTreeNext)
                if (!canceld) {
                    setMarkedTree(Object.assign({}, markedTreeNext))
                }
            })
        }
        return () => {
            canceld = true
        }
    }, [syncFolderId, tree, originalSyncPack, syncRemoteVersionId, syncVersionId])






    const isSameVersion = syncRemoteVersionId === syncVersionId
    const isEasyMerge = syncRemoteVersionId - syncVersionId === 1
    const isConflict = syncRemoteVersionId - syncVersionId > 1
    const isRemoteNeedUpload = syncVersionId - syncRemoteVersionId > 0

    return {
        isSameVersion,
        isEasyMerge,
        isConflict,
        isProcessing,
        isRemoteNeedUpload,

        originalSyncPack,
        markedTree,
        updateMarkedTree: setMarkedTree,
    }

}
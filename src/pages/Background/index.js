
import {
    ExtActions,
    kExtensionState,

    kOriginalSyncPack,
    kProcessing,
    kSyncFolderId,
    kSyncRemoteVersionId,
    kSyncVersionId,
    kUploadTask,
} from '../../constants/kv';
import { getMarkedTree, restoreSyncPack, walkMarkedTree } from '../../actions/restoreSyncPack'
import { generateSyncPack } from '../../actions/generateSyncPack'
import { ActionUI } from '../../actions/chromeAction'


const globalState = {
    processing: false,
    syncFolderId: null,
    gatherTimmer: null,
    showNotification: false,
    syncRemoteType: 'http+internal',
    syncRemoteHost: 'http://127.0.0.1:4000'
}

async function getRemoteVersion() {

    const url = new URL('/version', globalState.syncRemoteHost)
    const resp = await fetch(url.toString())
    const json = await resp.json()
    return json.version
}
async function getRemoteConfig() {
    const url = new URL('/config', globalState.syncRemoteHost)
    const resp = await fetch(url)
    const json = await resp.json()
    return json
}
async function updateRemoteConfig(params) {

    const url = new URL('/config', globalState.syncRemoteHost)
    url.searchParams.set('version', params.updateVersion)

    const resp = await fetch(url.toString(), {
        method: "POST",
        body: JSON.stringify(params.data),
    })
    const json = await resp.json()
    return json
}


// init processing state
chrome.storage.sync.get(kSyncFolderId, ({ [kSyncFolderId]: syncFolderId }) => {
    globalState.syncFolderId = syncFolderId;
});
chrome.storage.local.get([kProcessing], (result) => {
    globalState.processing = result[kProcessing] || false;
})

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === kProcessing) {
            // console.log('processing', newValue);
            globalState.processing = newValue;
        } else if (key === kSyncFolderId) {
            globalState.syncFolderId = newValue;
        }

        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
});


// eslint-disable-next-line no-restricted-globals
self.addEventListener("install", (event) => {
    // The promise that skipWaiting() returns can be safely ignored.
    console.log('skip waiting');
    // eslint-disable-next-line no-restricted-globals
    self.skipWaiting();

    // Perform any other actions required for your
    // service worker to install, potentially inside
    // of event.waitUntil();
});


let fetchRemoteConfigInterval = setupFetchRemoteConfig();
function setupFetchRemoteConfig() {
    ActionUI.reset();
    const trigger = async () => {
        console.log(new Date().toLocaleString(), 'interval')
        if (navigator.onLine === false) {
            ActionUI.yellow('离线')
            return
        }
        const { [kSyncVersionId]: currentVersion } = await chrome.storage.sync.get(kSyncVersionId)
        if (currentVersion === undefined) {
            // not set sync id
            return
        }
        let remoteVersion = -1;
        try {
            remoteVersion = await getRemoteVersion();
        } catch (e) {
            console.error(e);
            ActionUI.red('失败');
            return
        }
        // save to local
        const {
            [kSyncRemoteVersionId]: localRemoteId,
            [kUploadTask]: uploadTask,
        } = await chrome.storage.local.get([
            kSyncRemoteVersionId,
            kUploadTask,
        ])
        if (uploadTask) {
            // 如果存在上传任务，先进行上传操作
            if (uploadTask.updateVersion === remoteVersion) {
                // 如果上传的版本就是当前版本，那么直接上传
                const result = await updateRemoteConfig(uploadTask)
                if (result.version === uploadTask.updateVersion) {
                    // 上传的版本一样，说明没有更新成功
                } else {
                    // 说明上传成功了
                    await chrome.storage.local.remove(kUploadTask)
                    remoteVersion = result.version;
                }
            }
        }



        if (localRemoteId !== remoteVersion) {
            const { [kProcessing]: localProcessing } = await chrome.storage.local.get(kProcessing)
            if (localProcessing) {
                return
            }
            const remoteSyncPack = await getRemoteConfig();
            // set data to there
            await chrome.storage.local.set({
                [kOriginalSyncPack]: remoteSyncPack,
                [kSyncRemoteVersionId]: remoteVersion
            })
        }
        console.log('remoteVersion=', remoteVersion, ',currentVersion=', currentVersion)

        if (remoteVersion === currentVersion) {
            ActionUI.reset()
            return
        }

        if (remoteVersion <= currentVersion) {
            // do nothing
            ActionUI.red('异常')
            return
        }
        const {
            [kProcessing]: localProcessing,
            [kUploadTask]: uploadTask2
        } = await chrome.storage.local.get([kProcessing, kUploadTask])
        if (localProcessing) {
            return
        }
        if (uploadTask2) {
            ActionUI.red('待上传')
            return
        }
        if (remoteVersion - currentVersion === 1) {
            // 两个相差为1，直接合并
            console.log('两者相差为1，直接合并');

            const {
                [kOriginalSyncPack]: remoteSyncPack,
            } = await chrome.storage.local.get(kOriginalSyncPack)
            await onlyOverrideBookmarks(remoteSyncPack);
            await chrome.storage.sync.set({
                [kSyncVersionId]: remoteVersion,
            })

            // send notification
            if (globalState.showNotification) {
                chrome.notifications.create('' + remoteVersion, {
                    title: '书签同步成功',
                    type: 'basic',
                    iconUrl: 'icon-128.png',
                    silent: true,
                    message: '当前版本:' + remoteVersion,
                })
            }
            ActionUI.reset();
        } else {
            ActionUI.yellow('冲突');
            if (localRemoteId !== remoteVersion) {

            }
        }
    }
    return setInterval(trigger, 5000)
}
const isMessage = (message, type) => {
    if (typeof message === 'string') {
        return message === type
    } else if (typeof message === 'object' && message !== null) {
        return message.type === type
    }
}
const eventListender = async (message, sender, sendResponse) => {
    if (message !== ExtActions.isInterlvalExist && message !== ExtActions.getBackgroundState) {
        console.log(sender, 'message', message)
    }
    if (isMessage(message, ExtActions.override)) {
        try {
            const { data: syncPack } = message;
            await onlyOverrideBookmarks(syncPack);
            sendResponse({ done: true });
        } catch (e) {
            sendResponse({ done: true, error: e });
        }
    } else if (isMessage(message, ExtActions.getBackgroundState)) {
        sendResponse({ ...globalState });
    } else if (isMessage(message, ExtActions.changeBackgroundState)) {
        Object.assign(globalState, message.state);
        sendResponse();
    } else if (isMessage(message, ExtActions.walkmarkedTree)) {
        try {
            if (message.kind === 'forward') {
                await overrideBookmarksWithMarkedTree(message.markedTree)
                await chrome.storage.sync.set({ [kSyncVersionId]: message.nextVersionId })
            } else if (message.kind === 'merged-update') {
                await overrideBookmarksWithMarkedTree(message.markedTree)
                await chrome.storage.sync.set({ [kSyncVersionId]: message.nextVersionId })
                await takeSnapshotAndUpload(message.nextVersionId)
            }
            sendResponse({ done: true });
        } catch (e) {
            sendResponse({ done: true, error: e });
        }
    } else if (message === ExtActions.isInterlvalExist) {
        if (typeof fetchRemoteConfigInterval === 'number') {
            sendResponse({ running: true });
        } else {
            sendResponse({ running: false });
        }
    } else if (message === ExtActions.resumeSync) {
        if (typeof fetchRemoteConfigInterval === 'number') {
            clearInterval(fetchRemoteConfigInterval);
        }
        fetchRemoteConfigInterval = setupFetchRemoteConfig();

    } else if (message === ExtActions.pauseSync) {
        if (typeof fetchRemoteConfigInterval === 'number') {
            clearInterval(fetchRemoteConfigInterval);
            fetchRemoteConfigInterval = undefined;
        }
        ActionUI.yellow('暂停')
    }
}
chrome.runtime.onMessage.addListener(eventListender);

async function onlyOverrideBookmarks(syncPack) {
    console.log('overrideBookmarks use syncPack', syncPack);
    if (syncPack) {
        const { [kProcessing]: processing } = await chrome.storage.local.get(kProcessing)
        if (processing) {
            return;
        }
        await chrome.storage.local.set({ [kProcessing]: true },)
        await restoreSyncPack(syncPack)
        await chrome.storage.local.set({ [kProcessing]: false },)
    }
}

async function overrideBookmarksWithMarkedTree(markedTree) {
    console.log('overrideBookmarksWithMarkedTree use markedTree', markedTree);
    if (markedTree) {
        const processing = await chrome.storage.local.get(kProcessing)
        if (processing[kProcessing]) {
            return;
        }
        await chrome.storage.local.set({ [kProcessing]: true },)
        await walkMarkedTree(markedTree)
        await chrome.storage.local.set({ [kProcessing]: false },)
    }
}

async function takeSnapshotAndUpload(version) {
    const currentSnapshot = await generateSyncPack();
    await chrome.storage.local.set({
        [kUploadTask]: {
            updateVersion: version,
            data: currentSnapshot
        }
    })
}



// bookmarks related functions 
async function updateSnapshot() {
    const { [kSyncFolderId]: syncFolderId, [kSyncVersionId]: syncVersionId, } = await chrome.storage.sync.get([kSyncFolderId, kSyncVersionId])
    if (!syncFolderId) {
        console.warn('syncFolderId not found')
        return
    }
    takeSnapshotAndUpload(syncVersionId)
}

async function checkShouldUpload(id) {
    if (globalState.processing) {
        return
    }
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)
    if (!syncFolderId) {
        console.warn('syncFolderId not found')
        return
    }
    const [tree] = await chrome.bookmarks.getSubTree(syncFolderId)

    if (syncFolderId === id) {
        console.warn('syncFolderId === id')
        // return //true
    }
    const walkTree = (treeData) => {
        if (treeData.id === id) {
            return true
        }
        if (treeData.children) {
            return treeData.children.some(walkTree)
        }
        return false
    }
    const shouldUpload = walkTree(tree)
    if (shouldUpload) {
        clearTimeout(globalState.gatherTimmer)
        globalState.gatherTimmer = setTimeout(updateSnapshot, 4000);
    }

}

// bookmarks related event
chrome.bookmarks.onCreated.addListener(
    (id, changeInfo) => {
        checkShouldUpload(id)
        console.log('onCreated', id, changeInfo);
    }
)
chrome.bookmarks.onMoved.addListener(
    (id, changeInfo) => {
        checkShouldUpload(id)
        console.log('onMoved', id, changeInfo);
    }
)
chrome.bookmarks.onChanged.addListener(
    (id, changeInfo) => {
        checkShouldUpload(id)
        console.log('onChanged', id, changeInfo);
    }
)
chrome.bookmarks.onChildrenReordered.addListener(
    (id, reorderInfo) => {
        checkShouldUpload(id)
        console.log('onChildrenReordered', id, reorderInfo);
    }
)

chrome.bookmarks.onRemoved.addListener(
    (id, changeInfo) => {
        // should use parent id to detect
        // because can not get the removed node
        checkShouldUpload(changeInfo.parentId)
        console.log('onRemoved', id, changeInfo);
    }
)

chrome.bookmarks.onImportBegan.addListener(
    () => {
        globalState.processing = true;
        console.log('onImportBegan');
    }
)
chrome.bookmarks.onImportEnded.addListener(
    () => {
        globalState.processing = false;
        console.log('onImportEnded');
    }
)

import { ExtActions, kExtensionState, kMarkedTreeForReview, kOriginalSyncPack, kProcessing, kSyncRemoteVersionId, kSyncVersionId } from '../../constants/kv';
import { getMarkedTree, restoreSyncPack } from '../../actions/restoreSyncPack'
import { ActionUI } from '../../actions/chromeAction'

async function getRemoteVersion() {
    const resp = await fetch('http://127.0.0.1:4000/version')
    const json = await resp.json()
    return json.version
}
async function getRemoteConfig() {
    const resp = await fetch('http://127.0.0.1:4000/config')
    const json = await resp.json()
    return json
}

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
    return setInterval(async () => {
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
        const { [kSyncRemoteVersionId]: localRemoteId } = await chrome.storage.sync.get(kSyncRemoteVersionId)
        console.log('remoteVersion=', remoteVersion, ',currentVersion=', currentVersion)
        if (remoteVersion === currentVersion) {
            ActionUI.reset()
            if (localRemoteId !== remoteVersion) {
                chrome.storage.sync.set({ [kSyncRemoteVersionId]: remoteVersion })
            }
            return
        }
        if (remoteVersion <= currentVersion) {
            // do nothing
            ActionUI.red('异常')
            return
        }
        const { [kProcessing]: localProcessing } = await chrome.storage.local.get(kProcessing)
        if (localProcessing) {
            return
        }
        if (remoteVersion - currentVersion === 1) {
            const remoteSyncPack = await getRemoteConfig();
            // 两个相差为1，直接合并
            console.log('两者相差为1，直接合并');

            // set data to there
            await chrome.storage.local.set({ [kOriginalSyncPack]: remoteSyncPack })
            await overrideBookmarks();

            await chrome.storage.sync.set({
                [kSyncVersionId]: remoteVersion,
                [kSyncRemoteVersionId]: remoteVersion
            })
            // clean local
            await chrome.storage.local.remove([kOriginalSyncPack, kMarkedTreeForReview])

            // send notification
            chrome.notifications.create('' + currentVersion, {
                title: '书签同步成功',
                type: 'basic',
                iconUrl: 'icon-128.png',
                silent: true,
                message: '当前版本:' + currentVersion,
            })
            ActionUI.reset();
        } else {
            ActionUI.yellow('冲突');
            if (localRemoteId !== remoteVersion) {
                const remoteSyncPack = await getRemoteConfig();
                getMarkedTree(remoteSyncPack).then((markedTree) => {
                    chrome.storage.local.set({
                        [kOriginalSyncPack]: remoteSyncPack,
                        [kMarkedTreeForReview]: markedTree,
                    })
                    chrome.storage.sync.set({
                        [kSyncRemoteVersionId]: remoteVersion,
                    });
                })
            }
        }

    }, 5000)
}
const eventListender = async (message, sender, sendResponse) => {
    if (message !== ExtActions.isInterlvalExist) {
        console.log(sender, 'message', message)
    }
    if (message === ExtActions.override) {
        try {
            await overrideBookmarks();
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

async function overrideBookmarks() {
    const { [kOriginalSyncPack]: syncPack } = await chrome.storage.local.get(kOriginalSyncPack)
    console.log('overrideBookmarks use syncPack', syncPack);
    if (syncPack) {
        const processing = await chrome.storage.local.get(kProcessing)
        if (processing[kProcessing]) {
            return;
        }
        await chrome.storage.local.set({ [kProcessing]: true },)
        await restoreSyncPack(syncPack)
        await chrome.storage.local.set({ [kProcessing]: false },)


    }
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
});
chrome.bookmarks.onChanged.addListener(
    (id, changeInfo) => {
        console.log('onChanged', id, changeInfo);
    }
)
chrome.bookmarks.onMoved.addListener(
    (id, changeInfo) => {
        console.log('onMoved', id, changeInfo);
    }
)
chrome.bookmarks.onRemoved.addListener(
    (id, changeInfo) => {
        console.log('onRemoved', id, changeInfo);
    }
)
chrome.bookmarks.onCreated.addListener(
    (id, changeInfo) => {
        console.log('onCreated', id, changeInfo);
    }
)
chrome.bookmarks.onChildrenReordered.addListener(
    (id, reorderInfo) => {
        console.log('onChildrenReordered', id, reorderInfo);
    }
)
chrome.bookmarks.onCreated.addListener(
    (id, bookmark) => {
        console.log('onCreated', id, bookmark);
    }
)
chrome.bookmarks.onMoved.addListener(
    (id, moveInfo) => {
        console.log('onMoved', id, moveInfo);
    }
)

chrome.bookmarks.onImportBegan.addListener(
    () => {
        console.log('onImportBegan');
    }
)
chrome.bookmarks.onImportEnded.addListener(
    () => {
        console.log('onImportEnded');
    }
)

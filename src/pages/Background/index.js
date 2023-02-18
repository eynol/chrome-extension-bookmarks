import { ExtActions, kModifiedRecord, kProcessing, kSyncVersionId } from '../../constants/kv';
import { restoreSyncPack } from '../../actions/restoreSyncPack'


setInterval(async () => {
    console.log(new Date().toLocaleString(), 'interval')
    const { [kSyncVersionId]: currentVersion } = await chrome.storage.sync.get(kSyncVersionId)
    if (currentVersion === undefined) {
        // not set sync id
        return
    }

    const { version } = await (await fetch('http://127.0.0.1:4000/version')).json()

    console.log('res', version, currentVersion)
}, 5000)

const eventListender = async (message, sender, sendResponse) => {
    console.log(sender, 'message', message)
    if (message === ExtActions.beginSync) {
        try {
            await beiginMergeBookmarks();
            sendResponse({ done: true });
        } catch (e) {
            sendResponse({ done: true, error: e });
        }

    }
}
chrome.runtime.onMessage.addListener(eventListender);

async function beiginMergeBookmarks() {
    const { [kModifiedRecord]: modifyedRecord } = await chrome.storage.local.get(kModifiedRecord)
    console.log('modifyedRecord', modifyedRecord);
    if (modifyedRecord) {
        const processing = await chrome.storage.local.get(kProcessing)
        if (processing[kProcessing]) {
            return;
        }
        await chrome.storage.local.set({ [kProcessing]: true },)

        await restoreSyncPack(modifyedRecord)

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

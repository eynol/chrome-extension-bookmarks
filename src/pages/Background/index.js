console.log('This is the background page.');
console.log('Put the background scripts here.');


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

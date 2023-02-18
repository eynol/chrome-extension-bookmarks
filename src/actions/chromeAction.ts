export const ActionUI = {

    yellow: (txt: string | number) => {
        chrome.action.setBadgeBackgroundColor({ color: 'yellow' })
        chrome.action.setBadgeText({ text: txt.toString() })
    },
    red: (count: string | number) => {
        chrome.action.setBadgeBackgroundColor({ color: 'red' })
        chrome.action.setBadgeText({ text: count.toString() })
    },
    reset: () => {
        chrome.action.setBadgeBackgroundColor({ color: 'blue' })
        chrome.action.setBadgeText({ text: '' })
    },
}




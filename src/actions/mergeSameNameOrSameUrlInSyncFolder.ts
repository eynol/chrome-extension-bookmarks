import { kSyncFolderId } from "../constants/kv";

/**  合并【同步目录】中的的节点 */
export const mergeSameNameOrSameUrlInSyncFolder = async () => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)


    const walk = async (idList: string[]) => {

        for await (let id of idList) {
            const [node]: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(id);
            const { children } = node;
            if (children) {
                const urlNodeToDelete: string[] = [];
                const bookmarksToMerge = new Map<chrome.bookmarks.BookmarkTreeNode, chrome.bookmarks.BookmarkTreeNode>();

                const remainChilren = children.filter((node, index) => {
                    // 不可能为 -1
                    const mayBeSameIndex = children.findIndex(x => {
                        if (node.url) {
                            // 是超链接,只要标题或者URL一致就认为是同一个
                            return x.url === node.url

                        }
                        return x.title === node.title
                    });
                    // 自己找自己，一定会有的
                    const hasDuplicated = mayBeSameIndex < index;
                    if (hasDuplicated) {
                        // 如果找到了比自己小的节点的索引，说明需要将自己删除或者合并进前一个节点中
                        if (node.url) {
                            // 是相似的页面链接
                            urlNodeToDelete.push(node.id)
                            // chrome.bookmarks.remove(node.id);
                        } else {
                            // 是文件夹合并
                            bookmarksToMerge.set(node, children[mayBeSameIndex])
                        }

                    }
                    // 重复的节点不需要了。
                    return !hasDuplicated
                })
                await Promise.all(urlNodeToDelete.map(id => chrome.bookmarks.remove(id)))
                await Promise.all(Array.from(bookmarksToMerge.entries()).map(([source, target]) => {
                    return mergeTwoBookmarkFoldersAtSameLevel(source, target);
                }))

                // 继续递归
                console.log('继续递归', remainChilren.map(x => x.title));
                await walk(remainChilren.map(node => node.id));
            }
        }
    }
    await walk([syncFolderId]);

}

/**  合并两个chrome书签目录，只处理本层级的，不深入子层级 */
export const mergeTwoBookmarkFoldersAtSameLevel = async (source: chrome.bookmarks.BookmarkTreeNode, target: chrome.bookmarks.BookmarkTreeNode) => {
    if (source.url || target.url) {
        return
    }
    if (source.children && source.children.length) {
        const tasks = source.children.map(async sourceSingleChild => {
            if (!target.children) {
                return chrome.bookmarks.move(sourceSingleChild.id, { parentId: target.id })
            }
            if (sourceSingleChild.url) {
                // 页面链接
                if (target.children.some(x => x.url === sourceSingleChild.url)) {
                    // 对面已经有这个页面链接了，
                    return chrome.bookmarks.remove(sourceSingleChild.id)
                } else {
                    return chrome.bookmarks.move(sourceSingleChild.id, { parentId: target.id })
                }
            } else {
                // 文件夹类型
                const targetSameFolder = target.children.find(x => x.title === sourceSingleChild.title);

                if (targetSameFolder) {
                    console.log('相同的目录准备合并', targetSameFolder.title)
                    // 这里不做深度递归，只处理本层的
                    return Promise.all(sourceSingleChild.children?.map(x => chrome.bookmarks.move(x.id, { parentId: targetSameFolder.id })) ?? []).then(
                        // 对面已经有这个页面链接了，
                        () => chrome.bookmarks.remove(sourceSingleChild.id)
                    )
                    // return mergeTwoChromeBookMarkFolders(node, targetSameFolder)
                } else {
                    console.log('没有找到相同的文件夹，就直接移动过去', sourceSingleChild.title);
                    // 没有找到相同的文件夹，就直接移动过去
                    return chrome.bookmarks.move(sourceSingleChild.id, { parentId: target.id })
                }

            }
        })
        await Promise.all(tasks);
    }
    return chrome.bookmarks.remove(source.id);
}
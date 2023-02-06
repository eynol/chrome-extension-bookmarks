import { kSyncFolderId } from "../constants/kv";
import { mergeJsonTreeMark } from './mergeJsonTree'
import { singleTreeWalker } from './markTreeWalker'
import { EditedChromeNode } from "../interfaces";
/**  合并【同步目录】中的的节点 */
export const mergeSameNameOrSameUrlInSyncFolder = async () => {
    const { [kSyncFolderId]: syncFolderId } = await chrome.storage.sync.get(kSyncFolderId)


    const [node]: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getSubTree(syncFolderId);

    const markdedTree = mergeJsonTreeMark(node);
    await singleTreeWalker(markdedTree, {
        async created({ currentNode, parent, order }) {

            const createdNode = await chrome.bookmarks.create({
                parentId: parent?.id,
                index: order,
                title: currentNode.title,
                url: currentNode.url
            })
            return createdNode;
        },
        removed: async function ({ currentNode }): Promise<EditedChromeNode> {
            if (currentNode.url) {
                await chrome.bookmarks.remove(currentNode.id!)
            } else {
                await chrome.bookmarks.removeTree(currentNode.id!)
            }
            return currentNode;
        },
        ordered: async function ({ currentNode }): Promise<EditedChromeNode> {
            throw new Error("Function not implemented.");
        }
    }, [])

}

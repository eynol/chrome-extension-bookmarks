import { EditedChromeNode } from "../interfaces";

interface WalkerEnv {
    currentNode: EditedChromeNode,
    /** it's null when current node is root */
    parent: null | EditedChromeNode,
    order: number,
    paths: string[]
}
export const singleTreeWalker = async (node: EditedChromeNode, editor: {
    created: (ctx: WalkerEnv) => Promise<EditedChromeNode>,
    removed: (ctx: WalkerEnv) => Promise<EditedChromeNode>,
    ordered: (ctx: WalkerEnv) => Promise<EditedChromeNode>,
    renamed: (ctx: WalkerEnv) => Promise<EditedChromeNode>,
}, paths: string[]) => {

    if ((node.children?.length || -1) > 0) {
        for (let i = 0; i < node.children!.length; i++) {
            const child = node.children![i];

            if (child.removed) {
                await editor.removed({
                    currentNode: child,
                    parent: node,
                    order: i,
                    paths: paths
                })

            } else if (child.created) {
                const newNode = await editor.created({
                    currentNode: child,
                    parent: node,
                    order: i,
                    paths: paths
                })
                child.id = newNode.id;
                await singleTreeWalker(child, editor, [...paths, child.title!])
            } else if (child.ordered) {
                await editor.ordered({
                    currentNode: child,
                    parent: node,
                    order: i,
                    paths: paths
                })
                await singleTreeWalker(child, editor, [...paths, child.title!])
            } else if (child.renamed) {
                await editor.renamed({
                    currentNode: child,
                    parent: node,
                    order: i,
                    paths: paths
                })
                await singleTreeWalker(child, editor, [...paths, child.title!])
            } else {
                await singleTreeWalker(child, editor, [...paths, child.title!])
            }

        }
    }
}

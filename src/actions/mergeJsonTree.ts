import { EditedChromeNode } from "../interfaces";

const cloneWithKeys = <T extends { [k: string]: any }>(obj: T, keys: (keyof T)[]) => {
    const result: T = {} as T;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result
}

export const mergeJsonTreeMark = (chromeTree: EditedChromeNode) => {

    const result: EditedChromeNode = cloneWithKeys(chromeTree, ['id', 'title', 'url', 'index', 'children', 'parentId', 'created', 'removed']);

    if (result.children && result.children.length > 0) {
        const children = result.children;
        // 倒序遍历
        for (let currentIndex = children.length - 1; currentIndex >= 0; currentIndex--) {
            const currentNode = children[currentIndex];
            const isUrlLink = currentNode.url !== undefined;
            // 从前遍历
            const mayBeSameIndex = children.findIndex((unknownChild) => {
                if (isUrlLink) {
                    return unknownChild.url === currentNode.url
                }
                return unknownChild.title === currentNode.title;
            });

            if (mayBeSameIndex === currentIndex) {
                // same node and no other additional
                if (!isUrlLink) {
                    // is folder node
                    children[currentIndex] = mergeJsonTreeMark(currentNode);
                }
            } else {

                currentNode.removed = true;
                if (!isUrlLink) {
                    const duplicatedItem = children[mayBeSameIndex];
                    // 是文件夹合并
                    if (currentNode.children && currentNode.children.length > 0) {
                        duplicatedItem.children = duplicatedItem.children || [];

                        // 把子节点复制过去
                        duplicatedItem.children.push(...currentNode.children.map(markChildrenAsCreated));
                        delete currentNode.children;
                    }
                }
            }
        }
        result.children = result.children.filter((child) => !(child.removed && child.created));
    }
    return result;
}

const markChildrenAsCreated = (node: EditedChromeNode) => {
    node.created = true;
    if (node.children && node.children.length > 0) {
        node.children.forEach(markChildrenAsCreated)
    }
    return node
}
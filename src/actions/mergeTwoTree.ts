import { EditedChromeNode } from "../interfaces";

const is = {
    urlLink(node: EditedChromeNode) {
        return 'url' in node
    },
    sameNode(a: EditedChromeNode, b: EditedChromeNode) {
        // console.log(a, b)
        return 'url' in a ? a.url === b.url : a.title === b.title
    }
}

/** merge source to target */
export const mergeTwoTreeMark = (target: EditedChromeNode, source: EditedChromeNode,) => {

    const { children: targetChildren, } = target;
    const { children: sourceChildren, ...restSource } = source;
    Object.assign(target, restSource)
    if (is.urlLink(target)) {
        return target
    }
    // if target has no children, just replace it
    if (!targetChildren || targetChildren.length === 0) {
        target.children = sourceChildren ?? [];
        if (target.children.length > 0) {
            target.children.forEach(markChildrenAsRemoved);
        }

        return target;
    }

    // if source has no children, just return target
    if (!sourceChildren || sourceChildren.length === 0) {
        if (targetChildren?.length ?? 0 > 0) {
            targetChildren.forEach(markChildrenAsCreated)
        }
        return target
    }


    // use vue diff algorithm
    let targetLeft = 0;
    let targetRight = targetChildren.length - 1;
    let sourceLeft = 0;
    let sourceRight = sourceChildren.length - 1;


    let targetLeftNode = targetChildren[0];
    let targetRightNode = targetChildren[targetRight];
    let sourceLeftNode = sourceChildren[0];
    let sourceRightNode = sourceChildren[sourceRight];

    while (targetLeft <= targetRight && sourceLeft <= sourceRight) {
        // console.log(targetLeft, targetRight, sourceLeft, sourceRight)
        // may have been removed
        if (sourceLeftNode === null) {
            sourceLeftNode = sourceChildren[++sourceLeft];
        } else if (sourceRightNode === null) {
            sourceRightNode = sourceChildren[--sourceRight];
        }
        // else if (targetLeftNode === null) {
        //     targetLeftNode = targetChildren[++targetLeft];
        // } else if (targetRightNode === null) {
        //     targetRightNode = targetChildren[--targetRight];
        // }

        else if (is.sameNode(targetLeftNode, sourceLeftNode)) {
            mergeTwoTreeMark(targetLeftNode, sourceLeftNode);
            if (targetLeft !== sourceLeft) {
                targetLeftNode.ordered = true
            }
            targetLeftNode = targetChildren[++targetLeft];
            sourceLeftNode = sourceChildren[++sourceLeft];
        }
        else if (is.sameNode(targetRightNode, sourceRightNode)) {
            mergeTwoTreeMark(targetRightNode, sourceRightNode);
            if (targetRight !== sourceRight) {
                targetRightNode.ordered = true
            }

            targetRightNode = targetChildren[--targetRight];
            sourceRightNode = sourceChildren[--sourceRight];
        } else if (is.sameNode(targetLeftNode, sourceRightNode)) {

            mergeTwoTreeMark(targetLeftNode, sourceRightNode);
            if (targetLeft !== sourceRight) {
                targetLeftNode.ordered = true;
            }
            targetLeftNode.ordered = true;

            targetLeftNode = targetChildren[++targetLeft];
            sourceRightNode = sourceChildren[--sourceRight];
        } else if (is.sameNode(targetRightNode, sourceLeftNode)) {
            mergeTwoTreeMark(targetRightNode, sourceLeftNode);
            if (targetRight !== sourceLeft) {
                targetRightNode.ordered = true;
            }

            targetRightNode = targetChildren[--targetRight];
            sourceLeftNode = sourceChildren[++sourceLeft];
        } else {
            // find same node in source
            let foundLeft = false;

            for (let tempSourceLeft = sourceLeft + 1; tempSourceLeft < sourceRight; tempSourceLeft++) {
                const tempSourceNode = sourceChildren[tempSourceLeft];
                if (tempSourceNode && !foundLeft && is.sameNode(targetLeftNode, tempSourceNode)) {
                    foundLeft = true;
                    mergeTwoTreeMark(targetLeftNode, tempSourceNode);
                    // console.log('ordered between', targetLeftNode)
                    targetLeftNode.ordered = true;
                    (sourceChildren[tempSourceLeft] as unknown) = null;
                }
            }
            if (!foundLeft) {
                markChildrenAsCreated(targetLeftNode);
            }
            targetLeftNode = targetChildren[++targetLeft];

        }

    }
    // console.log(sourceLeft, sourceRight, targetLeft, targetRight)


    if (sourceLeft > sourceRight && targetLeft <= targetRight) {
        // source is empty,remain target
        for (let i = targetLeft; i <= targetRight; i++) {
            const node = targetChildren[i];
            if (node) {
                markChildrenAsCreated(node);
            }
        }
    }
    else if (targetLeft > targetRight && sourceLeft <= sourceRight) {
        // target is empty, add source
        for (let i = sourceLeft; i <= sourceRight; i++) {
            const node = sourceChildren[i];
            if (node) {
                markChildrenAsRemoved(node);
                targetChildren.push(node);
            }
        }
    }

    return target;
}

const markChildrenAsCreated = (node: EditedChromeNode) => {
    node.created = true;
    if (node.children && node.children.length > 0) {
        node.children.forEach(markChildrenAsCreated)
    }
    return node
}

const markChildrenAsRemoved = (node: EditedChromeNode) => {
    node.removed = true;
    if (node.children && node.children.length > 0) {
        node.children.forEach(markChildrenAsRemoved)
    }
    return node
}
import { EditedChromeNode } from "../interfaces"

export const NEW = { created: true };
export const ORDER = { ordered: true };
export const DEL = { removed: true };

export function gen(title: string, childrenOrUrl?: any[] | string, props?: Record<string, any>) {
    if (childrenOrUrl && typeof childrenOrUrl === 'string') {
        return {
            ...props,
            id: '1',
            title: title,
            url: childrenOrUrl
        } as EditedChromeNode
    }
    return {
        ...props,
        id: '1',
        title: title,
        children: childrenOrUrl
    } as EditedChromeNode
}
import { EditedChromeNode } from "../interfaces"
import { singleTreeWalker } from "./markTreeWalker"
import { DEL, gen, NEW, ORDER, RENAME } from "./testUtils"
describe('singleTreeWalker', () => {
    it('should walk create and deleted', async () => {
        const editor = {
            created: jest.fn(() => Promise.resolve({} as EditedChromeNode)),
            removed: jest.fn(() => Promise.resolve({} as EditedChromeNode)),
            ordered: jest.fn(() => Promise.resolve({} as EditedChromeNode)),
            renamed: jest.fn(() => Promise.resolve({} as EditedChromeNode)),
        }
        await singleTreeWalker(gen('1', [
            gen('Folder 1', [
                gen('link1', 'url1', NEW),
                gen('link2', 'url2', DEL),
                gen('link3', 'url3', ORDER),
                gen('link4', 'url4', RENAME),
                gen('link5', 'url5'),
            ])
        ]), editor, [])

        expect(editor.removed).toBeCalledTimes(1)
        expect(editor.created).toBeCalledTimes(1)
        expect(editor.ordered).toBeCalledTimes(1)
        expect(editor.renamed).toBeCalledTimes(1)
    })
})
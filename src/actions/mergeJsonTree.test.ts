import { EditedChromeNode } from '../interfaces';
import { mergeJsonTreeMark } from './mergeJsonTree';
import { gen, DEL, NEW } from './testUtils';

describe('mergeJsonTreeMark func', () => {
    it('should return it back with no changes', () => {

        const data = gen('1', [
            gen('node1', [])
        ])
        const result = mergeJsonTreeMark(data);
        expect(result).toEqual(data);
    })

    it('should do nothing x2', () => {

        const data = gen('1', [
            gen('node1', []),
            gen('node2', 'test'),
        ]);
        const result = mergeJsonTreeMark(Object.assign({}, data));
        expect(result).toEqual(data);
    })
    it('should remove same folder and url link', () => {
        expect(mergeJsonTreeMark(
            gen('1', [
                gen('node1', [
                    gen('node1', 'test'),
                    gen('node1', 'test'),
                ]),
                gen('node1', []),
                gen('node2', 'test'),
                gen('node2', 'test'),
            ])
        )).toEqual(gen('1', [
            gen('node1', [
                gen('node1', 'test'),
                gen('node1', 'test', DEL),
            ]),
            gen('node1', [], DEL),
            gen('node2', 'test'),
            gen('node2', 'test', DEL),
        ]));
    })

    it('should merge sub folders', () => {
        expect(mergeJsonTreeMark(
            gen('1', [
                gen('node1', [
                    gen('node2', [
                        gen('node3', 'url1'),
                    ]),
                    gen('node2', 'test'),
                ]),
                gen('node1', [
                    gen('node2', [
                        gen('node3', 'url1'),
                    ]),
                    gen('node2', 'test'),
                    gen('node2', [
                        gen('node3', 'url1'),
                        gen('node4', 'url2'),
                    ]),
                ]),
                gen('node2', 'test'),
                gen('node2', 'test'),
            ])

        )).toEqual(
            gen('1', [
                gen('node1', [
                    gen('node2', [
                        gen('node3', 'url1'),
                        gen('node4', 'url2', NEW),
                    ]),
                    gen('node2', 'test'),
                ]),
                gen('node1', [], DEL),
                gen('node2', 'test'),
                gen('node2', 'test', DEL),
            ])
        );
    })
})
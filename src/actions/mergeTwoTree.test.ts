import { mergeTwoTreeMark } from './mergeTwoTree'
import { gen, NEW, ORDER, DEL } from './testUtils';



describe('merge two tree ', () => {
    test('nothing happened', () => {
        expect(mergeTwoTreeMark(
            gen('1', []),
            gen('1', []),
        )).toEqual(
            gen('1', []),
        );
    })
    test('create folder when source empty', () => {
        expect(mergeTwoTreeMark(
            gen('1', [
                gen('2', []),
                gen('2', 'url1')
            ]),
            gen('1', [
            ]),
        )).toEqual(
            gen('1', [
                gen('2', [], NEW),
                gen('2', 'url1', NEW)
            ]),
        );
    })
    test('remove folder when target empty', () => {
        expect(mergeTwoTreeMark(
            gen('1', []),
            gen('1', [
                gen('2', []),
                gen('2', 'url1')
            ]),
        )).toEqual(
            gen('1', [
                gen('2', [], DEL),
                gen('2', 'url1', DEL)
            ]),
        );
    })

    test('no found duplicate', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('node1', []),
                gen('node2', 'test'),
            ]),
            gen('1', [
                gen('node1', []),
                gen('node2', 'test'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('node1', []),
                gen('node2', 'test'),
            ])
        );
    })


    test('create folder at level 1', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('FOLDER 1', []),
                gen('FOLDER 2', []),
                gen('FOLDER 3', []),
            ]),
            gen('1', [
                gen('OLD FOLDER', []),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('FOLDER 1', [], NEW),
                gen('FOLDER 2', [], NEW),
                gen('FOLDER 3', [], NEW),
                gen('OLD FOLDER', [], DEL),

            ])
        );
    })

    test('create folder at level 2', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('FOLDER 1', [
                    gen('FOLDER 1', []),
                    gen('FOLDER 2', []),
                    gen('FOLDER 3', []),
                ]),
                gen('FOLDER 2', []),
                gen('FOLDER 3', []),
            ]),
            gen('1', [
                gen('FOLDER 1', []),
                gen('OLD FOLDER', []),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('FOLDER 1', [
                    gen('FOLDER 1', [], NEW),
                    gen('FOLDER 2', [], NEW),
                    gen('FOLDER 3', [], NEW),
                ]),
                gen('FOLDER 2', [], NEW),
                gen('FOLDER 3', [], NEW),
                gen('OLD FOLDER', [], DEL),

            ])
        );
    })
    test('create link at level 1', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('LINK 1', 'url1'),
                gen('LINK 2', 'url2'),
                gen('LINK 3', 'url3'),
                gen('LINK 4', 'url4'),
            ]),
            gen('1', [
                gen('FOLDER 1', []),
                gen('OLD FOLDER', []),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('LINK 1', 'url1', NEW),
                gen('LINK 2', 'url2', NEW),
                gen('LINK 3', 'url3', NEW),
                gen('LINK 4', 'url4', NEW),
                gen('FOLDER 1', [], DEL),
                gen('OLD FOLDER', [], DEL),

            ])
        );
    })
    test('create link at level 2', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('FOLDER NEW', [
                    gen('LINK 1', 'url1'),
                    gen('LINK 2', 'url2'),
                    gen('LINK 3', 'url3'),
                    gen('LINK 4', 'url4'),
                ])
            ]),
            gen('1', [
                gen('FOLDER 1', []),
                gen('OLD FOLDER', []),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('FOLDER NEW', [
                    gen('LINK 1', 'url1', NEW),
                    gen('LINK 2', 'url2', NEW),
                    gen('LINK 3', 'url3', NEW),
                    gen('LINK 4', 'url4', NEW),
                ], NEW),
                gen('FOLDER 1', [], DEL),
                gen('OLD FOLDER', [], DEL),

            ])
        );
    })

    test('reorder 2 of 4 element at begin  level 1', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('b', 'url3'),
                gen('a', []),
                gen('c', []),
                gen('d', 'url2'),
            ]),
            gen('1', [
                gen('a', []),
                gen('b', 'url3'),
                gen('c', []),
                gen('d', 'url2'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('b', 'url3', ORDER),
                gen('a', [], ORDER),
                gen('c', []),
                gen('d', 'url2'),
            ])
        );
    })
    test('reorder 2 of 4 element at end  level 1', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('a', []),
                gen('b', 'url3'),
                gen('d', 'url2'),
                gen('c', []),
            ]),
            gen('1', [
                gen('a', []),
                gen('b', 'url3'),
                gen('c', []),
                gen('d', 'url2'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('a', []),
                gen('b', 'url3'),
                gen('d', 'url2', ORDER),
                gen('c', [], ORDER),
            ])
        );
    })
    test('reorder 2 of 4 element at start and end  level 1', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('d', 'url2'),
                gen('b', 'url3'),
                gen('c', []),
                gen('a', []),
            ]),
            gen('1', [
                gen('a', []),
                gen('b', 'url3'),
                gen('c', []),
                gen('d', 'url2'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('d', 'url2', ORDER),
                gen('b', 'url3'),
                gen('c', [],),
                gen('a', [], ORDER),
            ])
        );
    })

    test('reorder 4 of 4 element at level 1', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('c', []),
                gen('a', []),
                gen('d', 'url2'),
                gen('b', 'url3'),
            ]),
            gen('1', [
                gen('a', []),
                gen('b', 'url3'),
                gen('c', []),
                gen('d', 'url2'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('c', [], ORDER),
                gen('a', [], ORDER),
                gen('d', 'url2', ORDER),
                gen('b', 'url3', ORDER),
            ])
        );
    })
})
describe('match edge condition', () => {
    it('should mark all as removed', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('a', 'a'),
                gen('b', 'b'),
            ]),
            gen('1', [
                gen('a', 'a'),
                gen('c', 'c'),
                gen('d', 'd'),
                gen('e', 'e'),
                gen('folder', [gen('f', 'f')]),
                gen('b', 'b'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('a', 'a'),
                gen('b', 'b', ORDER),
                gen('c', 'c', DEL),
                gen('d', 'd', DEL),
                gen('e', 'e', DEL),
                gen('folder', [gen('f', 'f', DEL)], DEL),
            ])
        );
    })
    it('should mark all as created', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('a', 'a'),
                gen('c', 'c'),
                gen('d', 'd'),
                gen('e', 'e'),
                gen('b', 'b'),

            ]),
            gen('1', [
                gen('a', 'a'),
                gen('b', 'b'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('a', 'a'),
                gen('c', 'c', NEW),
                gen('d', 'd', NEW),
                gen('e', 'e', NEW),
                gen('b', 'b', ORDER),
            ])
        );
    })
    it('should skip null node', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('a', 'a'),
                gen('b', 'b'),
                gen('c', 'c'),
                gen('d', 'd'),
                gen('e', 'e'),
                gen('f', 'f'),
                gen('g', 'g'),
                gen('h', 'h'),

            ]),
            gen('1', [
                gen('b', 'b'),
                gen('a', 'a'),
                gen('d', 'd'),
                gen('e', 'e'),
                gen('f', 'f'),
                gen('h', 'h'),
                gen('g', 'g'),
                gen('c', 'c'),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('a', 'a', ORDER),
                gen('b', 'b', ORDER),
                gen('c', 'c', ORDER),
                gen('d', 'd', ORDER),
                gen('e', 'e', ORDER),
                gen('f', 'f', ORDER),
                gen('g', 'g', ORDER),
                gen('h', 'h', ORDER),
            ])
        );
    })
})
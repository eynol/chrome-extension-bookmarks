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

})

describe('merge props', () => {
    it('should merge props', () => {
        expect(mergeTwoTreeMark(
            gen('1', [
                gen('2', [], { id: 1 }),
                gen('2', 'url1', { 'fool': 'bar' }),
            ]),
            gen('1', [
                gen('2', [], { id: 334, parent: 'test' }),
                gen('xxx', 'url33')
            ]),
        )).toEqual(
            gen('1', [
                gen('2', [], { id: 334, parent: 'test', }),
                gen('2', 'url1', { 'fool': 'bar', ...NEW }),
                gen('xxx', 'url33', DEL)
            ]),
        );
    })
})


describe('create node', () => {

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

})




describe('reorder node', () => {
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

describe('mergeTwoTreeMark merge', () => {
    it('should merge two complex folder', () => {
        const result = mergeTwoTreeMark(
            gen('1', [
                gen('News', [
                    gen('Daily', [
                        gen('yesterday news', 'url2'),
                        gen('today news', 'url1'),
                    ]),
                    gen('Weekly', [
                        gen('always good news', 'url2'),
                        gen('Weekly news', 'url1'),
                    ]),
                ]),
                gen('Videos', [
                    gen('Funny', 'url3'),
                    gen('Sad', 'url5'),
                    gen('Cute', 'url4'),
                ]),
                gen('Favorite', [
                    gen('torrent resources', [
                        gen('linux', 'url6'),
                        gen('windows', 'url7'),
                        gen('mac', 'url8'),
                    ]),
                ]),
                gen('Blog', [
                    gen('my blog', 'url9'),
                    gen('Designer', [
                        gen('designer 1', 'url10'),
                        gen('designer 2', 'url11'),
                    ]),
                ]),
                gen('Work', [
                    gen('Deploy', [
                        gen('deploy 1', 'url12'),
                    ]),
                    gen('Navi', 'url1'),
                    gen('todo', [
                        gen('todo 1', 'url13'),
                        gen('todo 3', 'url15'),
                        gen('todo 2', 'url14'),
                    ])
                ]),

            ]),
            gen('1', [
                gen('News', [
                    gen('Daily', [
                        gen('today news', 'url1'),
                        gen('yesterday news', 'url2'),
                    ]),
                    gen('Weekly', [
                        gen('Weekly news', 'url1'),
                        gen('always good news', 'url2'),
                    ]),
                ]),
                gen('Favorite', [
                    gen('Videos', [
                        gen('Funny', 'url3'),
                        gen('Cute', 'url4'),
                        gen('Sad', 'url5'),
                    ]),
                    gen('torrent resources', [
                        gen('linux', 'url6'),
                        gen('windows', 'url7'),
                        gen('mac', 'url8'),
                    ]),
                ]),
                gen('Work', [
                    gen('Deploy', [
                        gen('deploy 1', 'url12'),
                    ]),
                    gen('todo', [
                        gen('todo 1', 'url13'),
                        gen('todo 2', 'url14'),
                    ]),
                    gen('Navi', 'url1'),
                ]),
            ]));
        expect(result).toEqual(
            gen('1', [
                gen('News', [
                    gen('Daily', [
                        gen('yesterday news', 'url2', ORDER),
                        gen('today news', 'url1', ORDER),
                    ]),
                    gen('Weekly', [
                        gen('always good news', 'url2', ORDER),
                        gen('Weekly news', 'url1', ORDER),
                    ]),
                ]),
                gen('Videos', [
                    gen('Funny', 'url3', NEW),
                    gen('Sad', 'url5', NEW),
                    gen('Cute', 'url4', NEW),
                ], NEW),
                gen('Favorite', [
                    gen('torrent resources', [
                        gen('linux', 'url6'),
                        gen('windows', 'url7'),
                        gen('mac', 'url8'),
                    ], ORDER),
                    gen('Videos', [
                        gen('Funny', 'url3', DEL),
                        gen('Cute', 'url4', DEL),
                        gen('Sad', 'url5', DEL),
                    ], DEL),
                ], ORDER),
                gen('Blog', [
                    gen('my blog', 'url9', NEW),
                    gen('Designer', [
                        gen('designer 1', 'url10', NEW),
                        gen('designer 2', 'url11', NEW),
                    ], NEW),
                ], NEW),
                gen('Work', [
                    gen('Deploy', [
                        gen('deploy 1', 'url12'),
                    ]),
                    gen('Navi', 'url1', ORDER),
                    gen('todo', [
                        gen('todo 1', 'url13'),
                        gen('todo 3', 'url15', NEW),
                        gen('todo 2', 'url14', ORDER),
                    ], ORDER)
                ], ORDER),
            ])
        );
    })
})
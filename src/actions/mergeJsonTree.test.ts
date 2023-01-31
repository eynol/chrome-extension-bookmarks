import { mergeJsonTreeMark } from './mergeJsonTree';



describe('整理树内部重复节点的状态', () => {
    test('没有找到就不清除重复的', () => {

        const data = {
            id: '1',
            title: '1',
            children: [
                {
                    id: '1',
                    title: '节点1',
                    index: 0,
                    parentId: '1',
                    children: [

                    ],
                },
            ],
        }
        const result = mergeJsonTreeMark(data);

        expect(result).toEqual(data);
    })

    test('没有找到就不清除重复的', () => {

        const data = {
            id: '1',
            title: '1',
            children: [
                {
                    id: '1',
                    title: '节点1',
                    index: 0,
                    parentId: '1',
                    children: [

                    ],
                },
                {
                    id: '1',
                    title: '节点2',
                    url: 'test'
                }
            ],
        }
        const result = mergeJsonTreeMark(Object.assign({}, data));
        expect(result).toEqual(data);
    })
    test('删除相同的目录', () => {
        expect(mergeJsonTreeMark({
            id: '1',
            title: '1',
            children: [
                {
                    id: '1',
                    title: '节点1',
                    children: [],
                },
                {
                    id: '1',
                    title: '节点1',
                },
                {
                    id: '2',
                    title: '节点3',
                    children: [],
                },
                {
                    id: '1',
                    title: '节点3',
                }
            ],
        })).toEqual({
            id: '1',
            title: '1',
            children: [
                {
                    id: '1',
                    title: '节点1',
                    children: [],
                },
                {
                    id: '1',
                    title: '节点1',
                    removed: true
                },
                {
                    id: '2',
                    title: '节点3',
                    children: [],
                },
                {
                    id: '1',
                    title: '节点3',
                    removed: true,
                }
            ],
        });
    })

    test('合并相同的目录的子节点', () => {
        expect(mergeJsonTreeMark({
            id: '1',
            title: '1',
            children: [
                {
                    id: '1',
                    title: '节点2',
                    children: [{
                        id: '1',
                        url: 'url1',
                        title: 't1'
                    }],
                },
                {
                    id: '1',
                    title: '节点2',
                    children: [
                        {
                            id: '1',
                            url: 'url1',
                            title: 't1'
                        }
                    ]
                },
                {
                    id: '2',
                    title: '节点3',
                    children: [
                        {
                            id: '1',
                            url: 'url1',
                            title: 't1'
                        },
                        {
                            id: '1',
                            url: 'url2',
                            title: 't1'
                        },

                    ],
                },
                {
                    id: '1',
                    title: '节点3',
                    children: [
                        {
                            id: '1',
                            title: 'subfolder',
                            children: [
                                {
                                    id: '1',
                                    title: 'anothersubfoler'
                                }
                            ]
                        },
                        {
                            id: '1',
                            url: 'url3',
                            title: 't1'
                        }
                    ]
                }
            ],
        })).toEqual({
            id: '1',
            title: '1',
            children: [
                {
                    id: '1',
                    title: '节点2',
                    children: [{
                        id: '1',
                        url: 'url1',
                        title: 't1'
                    }],
                },
                {
                    id: '1',
                    title: '节点2',
                    removed: true
                },
                {
                    id: '2',
                    title: '节点3',
                    children: [
                        {
                            id: '1',
                            url: 'url1',
                            title: 't1'
                        },
                        {
                            id: '1',
                            url: 'url2',
                            title: 't1'
                        },
                        {
                            id: '1',
                            title: 'subfolder',
                            created: true,
                            children: [
                                {
                                    id: '1',
                                    created: true,
                                    title: 'anothersubfoler'
                                }
                            ]
                        },
                        {
                            id: '1',
                            created: true,
                            url: 'url3',
                            title: 't1'
                        }
                    ],
                },
                {
                    id: '1',
                    title: '节点3',
                    removed: true,
                }
            ],
        });
    })
})
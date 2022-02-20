module.exports = {
    Items: [
        {
            key: 'U#1',
            notificationSortKey: 'U#:serverName#:currentDateTime',
            message: {
                alertLevel: 1,
                from: 'Clash-Bot',
                message: 'This is a low level alert'
            },
            timeAdded: ':currentDateTime'
        },
        {
            key: 'U#1',
            notificationSortKey: 'U#:serverName#:earlierDateTime',
            message: {
                alertLevel: 3,
                from: 'Clash-Bot',
                message: 'This is a high level alert that has a lot of information available for it. I really do not know what kind of information exactly'
                 + ' but it is quite a bit. I want to know what kind of information it is but I know one day I will find out.'
            },
            timeAdded: ':earlierDateTime'
        },
        {
            key: 'S#:serverName',
            notificationSortKey: 'S#:earlierDateTime',
            message: {
                alertLevel: 2,
                from: 'Clash-Bot',
                message: 'This is a medium level alert'
            },
            timeAdded: ':earlierDateTimes'
        },
        {
            key: 'S#:serverName',
            notificationSortKey: 'S#:currentDateTime',
            message: {
                alertLevel: 1,
                from: 'Clash-Bot',
                message: 'This is a low level alert'
            },
            timeAdded: ':currentDateTime'
        }
    ]
};
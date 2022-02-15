module.exports = {
    Items: [
        {
            key: 'U#1',
            notificationSortKey: 'U#:serverName#:currentDateTime',
            message: {
                alertLevel: 1,
                message: 'This is a low level alert'
            },
            timeAdded: ':currentDateTime'
        },
        {
            key: 'U#1',
            notificationSortKey: 'U#:serverName#:earlierDateTime',
            message: {
                alertLevel: 3,
                message: 'This is a high level alert'
            },
            timeAdded: ':earlierDateTime'
        },
        {
            key: 'S#:serverName',
            notificationSortKey: 'S#:earlierDateTime',
            message: {
                alertLevel: 2,
                message: 'This is a medium level alert'
            },
            timeAdded: ':earlierDateTimes'
        },
        {
            key: 'S#:serverName',
            notificationSortKey: 'S#:currentDateTime',
            message: {
                alertLevel: 1,
                message: 'This is a low level alert'
            },
            timeAdded: ':currentDateTime'
        }
    ]
};
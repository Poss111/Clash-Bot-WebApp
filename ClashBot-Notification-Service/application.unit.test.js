const {startUpApp} = require('./application');
const clashBotNotificationServiceImpl = require('./service/clash-bot-notification-service-impl');
const request = require('supertest');

jest.mock('./service/clash-bot-notification-service-impl');
jest.mock('./dao/clash-bot-notification-db-impl');

describe('Clash Bot Service API Controller', () => {
    let application;
    let server;

    beforeAll(async () => {
        application = await startUpApp();
        server = await application.listen();
    })

    afterAll(() => {
        server.close();
    })

    beforeEach(() => {
        jest.resetAllMocks();
    })

    describe('Get Notifications', () => {
        test('As a User, when I call /api/notifications with a user id I should be returned an empty array.', (done) => {
            clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser.mockResolvedValue([]);
            request(application)
                .get('/api/notifications?id=1')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser).toHaveBeenCalledTimes(1);
                    expect(clashBotNotificationServiceImpl.retrieveNotDismissedNotificationsForUser).toHaveBeenCalledWith("1");
                    expect(res.body).toEqual([]);
                    done();
                })
        })

        test('As a User, when I call /api/notifications I should be required to pass a user id.', (done) => {
            request(application)
                .get('/api/notifications')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Missing required parameter.'});
                    done();
                })
        })
    })

    describe('Post Notification', () => {
        test('As a User, when I call POST /api/notifications I should be required to call with a user id, from, ' +
            'serverName, message, and alertLevel to clashNotificationServiceImpl and be returned and api response.', (done) => {
            const apiRequest = {
                id: '1',
                from: 'Clash Bot',
                serverName: 'Goon Squad',
                message: 'Expected sample message.',
                alertLevel: 1
            };
            const expectedTimeAdded = new Date().toISOString();
            clashBotNotificationServiceImpl.persistUserNotification.mockResolvedValue({
                from: apiRequest.from,
                message: apiRequest.message,
                alertLevel: apiRequest.alertLevel,
                timeAdded: expectedTimeAdded
            });
            request(application)
                .post('/api/notifications')
                .send(apiRequest)
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashBotNotificationServiceImpl.persistUserNotification).toHaveBeenCalledTimes(1);
                    expect(clashBotNotificationServiceImpl.persistUserNotification)
                        .toHaveBeenCalledWith(apiRequest.id, apiRequest.from,
                            apiRequest.serverName, apiRequest.message, apiRequest.alertLevel);
                    expect(res.body).toEqual({
                        from: apiRequest.from,
                        message: apiRequest.message,
                        alertLevel: apiRequest.alertLevel,
                        timeAdded: expectedTimeAdded
                    });
                    done();
                })

        })
    })

    describe('Health Check', () => {
        test('As a User, when I call /api/notifications/health I should be returned a simple json payload stating it is healthy.', (done) => {
            request(application)
                .get('/api/notifications/health')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({status: 'Healthy'});
                    done();
                })
        })
    })

    describe('Not Found', () => {
        test('As a User, when I call a unmapped url I should have a generic message returned stating that the path was not found.', (done) => {
            request(application)
                .get('/api/dne')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404, (err, res) => {
                    if (err) return done(err);
                    expect(res.body).toEqual({error: 'Path not found.'});
                    done();
                })
        })
    })
})


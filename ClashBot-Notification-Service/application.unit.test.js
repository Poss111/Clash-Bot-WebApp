const {startUpApp, convertTeamDbToTeamPayload, convertTeamDbToTeamPayloadV2} = require('./application');
const clashBotNotificationServiceImpl = require('./service/clash-bot-notification-service-impl');
const request = require('supertest');

jest.mock('./service/clash-bot-notification-service-impl');

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
            clashBotNotificationServiceImpl.retrieveNotificationsForUser.mockResolvedValue([]);
            request(application)
                .get('/api/notifications?id=1')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, (err, res) => {
                    if (err) return done(err);
                    expect(clashBotNotificationServiceImpl.retrieveNotificationsForUser).toHaveBeenCalledTimes(1);
                    expect(clashBotNotificationServiceImpl.retrieveNotificationsForUser).toHaveBeenCalledWith("1");
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


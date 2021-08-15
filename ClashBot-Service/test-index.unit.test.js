const startApp = require('./test-index');
const request = require('supertest');

describe('Test for controller API testing', () => {
    let application;

    beforeAll((done) => {
        application = startApp();
        application.listen((err) => {
            if (err) done(err);
            done();
        });
    });

    afterAll(() => {
        console.log('Called');
        application.close();
    })

    test('test', (done) => {
        request(application).get('/api/test').set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, (err, res) => {
                if (err) return done(err);
                expect(res.body.status).toBeTruthy();
                done();
            })
    })
})

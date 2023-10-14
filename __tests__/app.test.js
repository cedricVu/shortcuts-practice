const request = require('supertest');
const app = require('../app');

app.set('port', 3001);

describe('API Endpoints', () => {
    it('POST /shortcuts - Create a new shortcut should failed if not sending the combination', async () => {
        const response = await request(app)
            .post('/shortcuts')
            .send({
                description: 'Paste on macOS',
                os: 'macos',
                application: 'test app',
            });
        expect(response.status).toBe(400);
    });

    it('POST /shortcuts - Create a new shortcut should successfully if send valid data', async () => {
        const response = await request(app)
            .post('/shortcuts')
            .send({
                combination: 'CMD+V',
                description: 'Paste on macOS',
                os: 'macos',
                application: 'test app',
            });
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            _id: {
                application: 'test app',
                os: 'macos'
            },
            shortcutCombination: {
                'cmd+v': {
                    combination: 'cmd+v',
                    description: 'Paste on macOS'
                }
            }
        });

        // Recheck to make sure data has been created
        const getResponse = await request(app)
            .post('/shortcuts/lookup')
            .send({
                combination: 'CMD+V',
                os: 'macos',
                application: 'test app',
            });

        expect(getResponse.status).toBe(200);
        expect(getResponse.body[0]).toMatchObject({
            _id: {
                application: 'test app',
                os: 'macos'
            },
            shortcutCombination: {
                'cmd+v': {
                    combination: 'cmd+v',
                    description: 'Paste on macOS'
                }
            }
        });
    });

    it('POST /shortcuts/lookup - Lookup specific shortcut should return correct data', async () => {
        const response = await request(app)
            .post('/shortcuts/lookup')
            .send({
                combination: 'cmd+v',
            });

        expect(response.status).toBe(200);
        expect(response.body[0]).toMatchObject({
            _id: {
                application: 'test app',
                os: 'macos'
            },
            shortcutCombination: {
                'cmd+v': {
                    combination: 'cmd+v',
                    description: 'Paste on macOS'
                }
            }
        });
    });

    it('POST /shortcuts/lookup - List shortcut of os should return correct data correspondingly', async () => {
        const response = await request(app)
            .post('/shortcuts/lookup')
            .send({
                combination: 'cmd+v',
            });

        expect(response.status).toBe(200);
        expect(response.body[0]).toMatchObject({
            _id: {
                application: 'test app',
            },
            shortcutCombination: {
                'cmd+v': {
                    combination: 'cmd+v',
                    description: 'Paste on macOS'
                }
            }
        });
    });

    it('POST /shortcuts/lookup - List shortcut of application should return correct data correspondingly', async () => {
        const response = await request(app)
            .post('/shortcuts/lookup')
            .send({
                combination: 'cmd+v',
            });

        expect(response.status).toBe(200);
        expect(response.body[0]).toMatchObject({
            _id: {
                os: 'macos'
            },
            shortcutCombination: {
                'cmd+v': {
                    combination: 'cmd+v',
                    description: 'Paste on macOS'
                }
            }
        });
    });

    // Todo: add more tests to cover other cases
});

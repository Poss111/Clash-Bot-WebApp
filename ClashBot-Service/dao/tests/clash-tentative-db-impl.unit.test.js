const clashTentativeDbImpl = require('../clash-tentative-db-impl');
const dynamoDbHelper = require('../impl/dynamo-db-helper');
const Joi = require('joi');

jest.mock('../impl/dynamo-db-helper');

beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
});

describe('Initialize Table connection', () => {
    test('Initialize the table connection to be used.', async () => {
        let expectedTableObject = {setupTable: true};
        dynamoDbHelper.initialize = jest.fn().mockResolvedValue(expectedTableObject);
        const expectedTableDef = {
            hashKey: 'key',
            timestamps: true,
            schema: {
                key: Joi.string(),
                tentativePlayers: Joi.array().items(Joi.string()),
                serverName: Joi.string(),
                tournamentDetails: expect.anything()
            }
        };
        return clashTentativeDbImpl.initialize().then(() => {
            expect(clashTentativeDbImpl.Tentative).toEqual(expectedTableObject);
            expect(dynamoDbHelper.initialize).toBeCalledWith(clashTentativeDbImpl.tableName,
                expectedTableDef);
        });

    })

    test('Error should be handled if it occurs during table initialization', async () => {
        const expectedError = new Error('Failed to compile table def');
        dynamoDbHelper.initialize = jest.fn().mockRejectedValue(expectedError);
        return clashTentativeDbImpl.initialize('Sample Table', {}).catch(err => expect(err).toEqual(expectedError));
    })
})

describe('Push person onto Tentative queue', () => {

    test('I should be able to pass a user id, server name, and tournament to place a user on tentative with a new tentative record for a Clash Tournament.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: dataToUpdate }))
        };
        const expectedTentativeObject = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: [expectedUserId],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        return clashTentativeDbImpl.addToTentative(expectedUserId, expectedServerName, expectedTournament)
            .then(persistedRecord => {
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedTentativeObject, expect.any(Function));
                expect(persistedRecord).toEqual(expectedTentativeObject);
            });
    })

    test('If a record already exists for the Tournament and the day and they do not already belong on it, the User should be added to the list instead of creating a new one.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedReturnedTentativeRecord = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: ['2'],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        let expectedReturnedTentativeRecordAfterUpdate = JSON.parse(JSON.stringify(expectedReturnedTentativeRecord));
        expectedReturnedTentativeRecordAfterUpdate.tentativePlayers.push(expectedUserId);
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: dataToUpdate })),
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, expectedReturnedTentativeRecord);
            })
        };
        return clashTentativeDbImpl.addToTentative(expectedUserId, expectedServerName, expectedTournament, expectedReturnedTentativeRecord)
            .then(persistedRecord => {
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedReturnedTentativeRecordAfterUpdate, expect.any(Function));
                expect(persistedRecord).toEqual(expectedReturnedTentativeRecordAfterUpdate);
            })
    })

    test('If a record exists for the Tournament and the day and the array of tentative users is null, the User should be added to the list of the existing one.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedReturnedTentativeRecord = {
            attrs: {
                key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
                serverName: expectedServerName,
                tournamentDetails: {
                    tournamentName: expectedTournament.tournamentName,
                    tournamentDay: expectedTournament.tournamentDay
                }
            }
        };
        let expectedReturnedTentativeRecordAfterUpdate = JSON.parse(JSON.stringify(expectedReturnedTentativeRecord.attrs));
        expectedReturnedTentativeRecordAfterUpdate.tentativePlayers = [expectedUserId];
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: dataToUpdate })),
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, expectedReturnedTentativeRecord);
            })
        };
        return clashTentativeDbImpl.addToTentative(expectedUserId, expectedServerName, expectedTournament).then(persistedRecord => {
            expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedReturnedTentativeRecordAfterUpdate, expect.any(Function));
            expect(persistedRecord).toEqual(expectedReturnedTentativeRecordAfterUpdate);
        })
    })

    test('If an error occurs, then it should be rejected.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedError = new Error('Failed to persist');
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(expectedError, { attrs: dataToUpdate }))
        };
        return clashTentativeDbImpl.addToTentative(expectedUserId, expectedServerName, expectedTournament)
            .then(persistedRecord => expect(persistedRecord).toBeFalsy())
            .catch(err => expect(err).toEqual(expectedError));
    })

})

describe('Remove person from Tentative queue', () => {
    test('If a User Id exists on the specified Tentative queue, they should be removed', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedTentativeObject = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: [expectedUserId],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        const expectedUpdatedTentativeObject = JSON.parse(JSON.stringify(expectedTentativeObject));
        expectedUpdatedTentativeObject.tentativePlayers.splice(expectedUpdatedTentativeObject.tentativePlayers.indexOf(expectedUserId), 1);
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: expectedUpdatedTentativeObject }))
        };

        return clashTentativeDbImpl.removeFromTentative(expectedUserId, expectedTentativeObject)
            .then(persistedRecord => {
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedTentativeObject, expect.any(Function));
                expect(persistedRecord).toEqual(expectedTentativeObject);
            });
    })

    test('If a User Id does not exist on the specified Tentative queue, they should not be removed', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedTentativeObject = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: ['2'],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: expectedTentativeObject }))
        };

        return clashTentativeDbImpl.removeFromTentative(expectedUserId, JSON.parse(JSON.stringify(expectedTentativeObject)))
            .then(persistedRecord => {
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedTentativeObject, expect.any(Function));
                expect(persistedRecord).toEqual(expectedTentativeObject);
            });
    })

    test('If the object passed is undefined, then it should return immediately with the undefined object.', () => {
        let expectedUserId = '1';
        return clashTentativeDbImpl.removeFromTentative(expectedUserId, undefined)
            .then(persistedRecord => expect(persistedRecord).toEqual(undefined));
    })

    test('If the object passed has an undefined tentative list, then it should return immediately with the undefined object.', () => {
        let expectedUserId = '1';
        return clashTentativeDbImpl.removeFromTentative(expectedUserId, {})
            .then(persistedRecord => expect(persistedRecord).toEqual({}));
    })

    test('If an error occurs while removing, then it should be caught and rejected.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedTentativeObject = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: [expectedUserId],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        const expectedUpdatedTentativeObject = JSON.parse(JSON.stringify(expectedTentativeObject));
        expectedUpdatedTentativeObject.tentativePlayers.splice(expectedUpdatedTentativeObject.tentativePlayers.indexOf(expectedUserId), 1);
        const expectedError = new Error('Failed to persist');
        clashTentativeDbImpl.Tentative = {
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(expectedError, { attrs: expectedUpdatedTentativeObject }))
        };

        return clashTentativeDbImpl.removeFromTentative(expectedUserId, expectedTentativeObject)
            .then(record => expect(record).toBeFalsy())
            .catch(err => expect(err).toEqual(expectedError));
    })

})

describe('Handle tentative', () => {
    test('If a user id is passed, and they are on tentative, they should be removed.', () => {

        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedTentativeObject = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: [expectedUserId],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        const expectedUpdatedTentativeObject = JSON.parse(JSON.stringify(expectedTentativeObject));
        expectedUpdatedTentativeObject.tentativePlayers.pop();
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((key, callback) => callback(undefined, { attrs: expectedTentativeObject })),
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: expectedUpdatedTentativeObject }))
        };

        return clashTentativeDbImpl.handleTentative(expectedUserId, expectedServerName, expectedTournament)
            .then(successful => {
                expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(expectedTentativeObject.key, expect.any(Function));
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedUpdatedTentativeObject, expect.any(Function));
                expect(successful).toBeTruthy();
            })
    })

    test('If a user id is passed, and they are not on tentative and there is an existing one, they should be added.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedTentativeObject = {
            key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
            tentativePlayers: [],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: expectedTournament.tournamentName,
                tournamentDay: expectedTournament.tournamentDay
            }
        };
        const expectedUpdatedTentativeObject = JSON.parse(JSON.stringify(expectedTentativeObject));
        expectedUpdatedTentativeObject.tentativePlayers.push(expectedUserId);
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((key, callback) => callback(undefined, { attrs: expectedTentativeObject })),
            update: jest.fn().mockImplementation((dataToUpdate, callback) => callback(undefined, { attrs: expectedUpdatedTentativeObject }))
        };

        return clashTentativeDbImpl.handleTentative(expectedUserId, expectedServerName, expectedTournament)
            .then(successful => {
                expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(expectedTentativeObject.key, expect.any(Function));
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledTimes(1);
                expect(clashTentativeDbImpl.Tentative.update).toHaveBeenCalledWith(expectedUpdatedTentativeObject, expect.any(Function));
                expect(successful).toBeTruthy();
            })
    })
})

describe('Is User on Tentative', () => {
    test('If a User is on Tentative for the Server and Tournament, it should return the tentative object.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedReturnedTentativeRecord = {
            attrs: {
                key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
                serverName: expectedServerName,
                tentativePlayers: [expectedUserId],
                tournamentDetails: {
                    tournamentName: expectedTournament.tournamentName,
                    tournamentDay: expectedTournament.tournamentDay
                }
            }
        };
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, expectedReturnedTentativeRecord);
            })
        };
        return clashTentativeDbImpl.isTentative(expectedUserId, expectedServerName, expectedTournament).then((record) => {
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(expectedReturnedTentativeRecord.attrs.key, expect.any(Function));
            expect(record.onTentative).toEqual(true);
            expect(record.tentativeList).toEqual(expectedReturnedTentativeRecord.attrs);
        })
    })

    test('If a User is not on Tentative for the Server and Tournament and there does not exist a record for the tournament details, it should return the false and undefined.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(null, null);
            })
        };
        return clashTentativeDbImpl.isTentative(expectedUserId, expectedServerName, expectedTournament).then((record) => {
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(`${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`, expect.any(Function));
            expect(record.onTentative).toBeFalsy();
            expect(record.tentativeList).toBeFalsy();
        })
    })

    test('If a User is not on Tentative for the Server and Tournament, it should return the tentative object.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedReturnedTentativeRecord = {
            attrs: {
                key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
                serverName: expectedServerName,
                tentativePlayers: ['2'],
                tournamentDetails: {
                    tournamentName: expectedTournament.tournamentName,
                    tournamentDay: expectedTournament.tournamentDay
                }
            }
        };
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, expectedReturnedTentativeRecord);
            })
        };
        return clashTentativeDbImpl.isTentative(expectedUserId, expectedServerName, expectedTournament).then((record) => {
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(expectedReturnedTentativeRecord.attrs.key, expect.any(Function));
            expect(record.onTentative).toBeFalsy();
            expect(record.tentativeList).toEqual(expectedReturnedTentativeRecord.attrs);
        })
    })

    test('If a User is not on Tentative for the Server and Tournament and the tentative list is empty, it should return the tentative object.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedReturnedTentativeRecord = {
            attrs: {
                key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
                serverName: expectedServerName,
                tournamentDetails: {
                    tournamentName: expectedTournament.tournamentName,
                    tournamentDay: expectedTournament.tournamentDay
                }
            }
        };
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, expectedReturnedTentativeRecord);
            })
        };
        return clashTentativeDbImpl.isTentative(expectedUserId, expectedServerName, expectedTournament).then((record) => {
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(expectedReturnedTentativeRecord.attrs.key, expect.any(Function));
            expect(record.onTentative).toBeFalsy();
            expect(record.tentativeList).toEqual(expectedReturnedTentativeRecord.attrs);
        })
    })

    test('If an error occurs, it should be rejected.', () => {
        let expectedUserId = '1';
        let expectedServerName = 'Awesome Server';
        let expectedTournament = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedReturnedTentativeRecord = {
            attrs: {
                key: `${expectedServerName}#${expectedTournament.tournamentName}#${expectedTournament.tournamentDay}`,
                serverName: expectedServerName,
                tentativePlayers: [expectedUserId],
                tournamentDetails: {
                    tournamentName: expectedTournament.tournamentName,
                    tournamentDay: expectedTournament.tournamentDay
                }
            }
        };
        const expectedError = new Error('Failed to retrieve.');
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => callback(expectedError, expectedReturnedTentativeRecord))
        };
        return clashTentativeDbImpl.isTentative(expectedUserId, expectedServerName, expectedTournament)
            .then((record) => expect(record).toBeFalsy())
            .catch(err => expect(err).toEqual(expectedError));
    })
})

describe('Retrieve Tentative', () => {
    test('If a server name, tournament name, and day is passed, then the matching tournament should be returned.', () => {
        let expectedServerName = 'Goon Squad';
        let expectedTournamentDetails = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        const expectedResponse = {
            key: `${expectedServerName}#${expectedTournamentDetails.tournamentName}#${expectedTournamentDetails.tournamentDay}`,
            tentativePlayers: ['1'],
            serverName: expectedServerName,
            tournamentDetails: {
                tournamentName: 'awesome_sauce',
                tournamentDay: '1'
            }
        }
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, {attrs: expectedResponse});
            })
        };
        return clashTentativeDbImpl.getTentative(expectedServerName, expectedTournamentDetails).then((tentativeList) => {
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(expectedResponse.key, expect.any(Function));
            expect(tentativeList).toEqual(expectedResponse);
        });
    })

    test('If a server name, tournament name, and day is passed but does not exist, then an undefined object should be returned.', () => {
        let expectedServerName = 'Goon Squad';
        let expectedTournamentDetails = {
            tournamentName: 'awesome_sauce',
            tournamentDay: '1'
        };
        clashTentativeDbImpl.Tentative = {
            get: jest.fn().mockImplementation((queryKey, callback) => {
                callback(undefined, undefined);
            })
        };
        return clashTentativeDbImpl.getTentative(expectedServerName, expectedTournamentDetails).then((tentativeList) => {
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledTimes(1);
            expect(clashTentativeDbImpl.Tentative.get).toHaveBeenCalledWith(`${expectedServerName}#${expectedTournamentDetails.tournamentName}#${expectedTournamentDetails.tournamentDay}`, expect.any(Function));
            expect(tentativeList).toEqual(undefined);
        });
    })
})

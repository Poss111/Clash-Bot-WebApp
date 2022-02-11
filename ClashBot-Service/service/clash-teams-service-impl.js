const clashTeamsDbImpl = require('../dao/clash-teams-db-impl');
const clashTentativeDbImpl = require('../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');
const logger = require('pino');

class ClashTeamsServiceImpl {
    createNewTeam(id, serverName, tournamentName, tournamentDay, startTime) {
        return new Promise((resolve, reject) => {
            clashTentativeDbImpl.isTentative(id, serverName,
                {tournamentName: tournamentName, tournamentDay: tournamentDay})
                .then(isTentativeResults => {
                    let registerPlayer = () => {
                        clashTeamsDbImpl.registerPlayer(id, serverName, [{
                            tournamentName: tournamentName,
                            tournamentDay: tournamentDay,
                            startTime: startTime
                        }]).then((response) => {
                            if (Array.isArray(response) && response[0].exist) {
                                resolve({error: 'Player is not eligible to create a new Team.'});
                            } else {
                                resolve(this.mapTeamDbResponseToApiResponse(response));
                            }
                        }).catch(reject);
                    };
                    if (isTentativeResults.onTentative) {
                        logger.info(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then(registerPlayer)
                            .catch(reject);
                    } else {
                        logger.info(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerPlayer();
                    }
                }).catch(reject);
        });
    }

    createNewTeamV2(id, role, serverName, tournamentName, tournamentDay, startTime) {
        return new Promise((resolve, reject) => {
            clashTentativeDbImpl.isTentative(id, serverName,
                {tournamentName: tournamentName, tournamentDay: tournamentDay})
                .then(isTentativeResults => {
                    let registerPlayer = () => {
                        clashTeamsDbImpl.registerPlayerToNewTeamV2(id, role, serverName, [{
                            tournamentName: tournamentName,
                            tournamentDay: tournamentDay,
                            startTime: startTime,
                        }]).then((dbResponse) => {
                            if (Array.isArray(dbResponse) && dbResponse[0].exist) {
                                resolve({error: 'Player is not eligible to create a new Team.'});
                            } else {
                                let playerIds = this.buildPlayerIdListFromTeamRegistrationResponse(dbResponse);

                                clashSubscriptionDbImpl.retrieveAllUserDetails([...playerIds])
                                    .then((idToPlayerMap) => {
                                        const mappedUnregisteredTeams = dbResponse.unregisteredTeams.map(item =>
                                            this.mapDbToDetailedApiResponseV2(item, idToPlayerMap));
                                        const apiResponse = {
                                            registeredTeam: this.mapDbToDetailedApiResponseV2(dbResponse.registeredTeam, idToPlayerMap),
                                            unregisteredTeams: [...mappedUnregisteredTeams]
                                        };
                                        resolve(apiResponse);
                                    });
                            }
                        }).catch(reject);
                    };
                    if (isTentativeResults.onTentative) {
                        logger.info(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then(registerPlayer)
                            .catch(reject);
                    } else {
                        logger.info(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerPlayer();
                    }
                }).catch(reject);
        });
    }

    buildPlayerIdListFromTeamRegistrationResponse(dbResponse) {
        let playerIds = new Set();
        if (dbResponse.registeredTeam) {
            dbResponse.registeredTeam.players.forEach(id => playerIds.add(id));
        }
        if (Array.isArray(dbResponse.unregisteredTeams)) {
            let unregisteredUsers = dbResponse.unregisteredTeams
                .map(data => data.players)
                .flat()
                .filter(id => id);
            if (unregisteredUsers.length > 0) {
                unregisteredUsers.forEach(id => playerIds.add(id));
            }
        }
        return playerIds;
    }

    async mapTeamDbResponseToApiResponse(response) {
        let idToNameMap = await clashSubscriptionDbImpl.retrievePlayerNames(response.players);
        return this.mapDbToApiResponse(response, idToNameMap);
    }

    mapDbToApiResponse(response, idToNameMap) {
        return {
            teamName: response.teamName,
            serverName: response.serverName,
            playersDetails: Array.isArray(response.players) ? response.players.map(data => {
                return {name: !idToNameMap[data] ? data : idToNameMap[data]}
            }) : {},
            tournamentDetails: {
                tournamentName: response.tournamentName,
                tournamentDay: response.tournamentDay
            },
            startTime: response.startTime,
        };
    }

    registerWithTeam(id, teamName, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            let registerWithSpecificTeam = () => {
                clashTeamsDbImpl.registerWithSpecificTeam(id, serverName, [{
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                }], teamName)
                    .then((dbResponse) => {
                        if (!dbResponse) {
                            resolve({error: 'Unable to find the Team requested to be persisted.'});
                        } else {
                            resolve(this.mapTeamDbResponseToApiResponse(dbResponse));
                        }
                    }).catch(reject);
            }
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(tentativeResults => {
                    if (tentativeResults.onTentative) {
                        logger.info(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, tentativeResults.tentativeList)
                            .then(registerWithSpecificTeam)
                            .catch(reject);
                    } else {
                        logger.info(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerWithSpecificTeam();
                    }
                })
                .catch(reject);
        });
    }

    registerWithTeamV2(id, role, teamName, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            let registerWithSpecificTeamV2 = () => {
                clashTeamsDbImpl.registerWithSpecificTeamV2(id, role, serverName, [{
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                }], teamName)
                    .then((dbResponse) => {
                        if (!dbResponse || !dbResponse.registeredTeam) {
                            resolve({error: 'Unable to find the Team requested to be persisted.'});
                        } else {
                            let playerIds = this.buildPlayerIdListFromTeamRegistrationResponse(dbResponse);

                            clashSubscriptionDbImpl.retrieveAllUserDetails([...playerIds])
                                .then((idToPlayerMap) => {
                                    const mappedUnregisteredTeams = dbResponse.unregisteredTeams.map(item =>
                                        this.mapDbToDetailedApiResponseV2(item, idToPlayerMap));
                                    const registrationApiResponsePayload = {
                                        registeredTeam:
                                            this.mapDbToDetailedApiResponseV2(dbResponse.registeredTeam, idToPlayerMap),
                                        unregisteredTeams: [...mappedUnregisteredTeams]
                                    };
                                    resolve(registrationApiResponsePayload);
                                });
                        }
                    }).catch(reject);
            }
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(tentativeResults => {
                    if (tentativeResults.onTentative) {
                        logger.info(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, tentativeResults.tentativeList)
                            .then(registerWithSpecificTeamV2)
                            .catch(reject);
                    } else {
                        logger.info(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerWithSpecificTeamV2();
                    }
                })
                .catch(reject);
        });
    }

    unregisterFromTeam(id, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            clashTeamsDbImpl.deregisterPlayer(id, serverName, [{
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            }])
                .then(dbResponse => {
                    if (!dbResponse) resolve({error: 'User not found on requested Team.'});
                    else resolve(this.mapTeamDbResponseToApiResponse(dbResponse));
                }).catch(reject);
        });
    }

    unregisterFromTeamV2(id, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            clashTeamsDbImpl.deregisterPlayerV2(id, serverName, [{
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            }])
                .then(dbResponse => {
                    if (!dbResponse) resolve({error: 'User not found on requested Team.'});
                    else {
                        let playerIds = this.buildPlayerIdListFromTeamRegistrationResponse({ unregisteredTeams: dbResponse });
                        clashSubscriptionDbImpl.retrieveAllUserDetails([...playerIds])
                            .then((idToPlayerMap) => {
                                resolve(dbResponse.map(item => this.mapDbToDetailedApiResponseV2(item, idToPlayerMap)))
                            });
                    }
                }).catch(reject);
        });
    }

    retrieveTeamsByServerAndTournaments(serverName, activeTournaments) {
        return new Promise((resolve, reject) => {
            clashTeamsDbImpl.getTeams(serverName).then(dbResponse => {
                let payload = [];
                dbResponse = dbResponse.filter(team =>
                    Array.isArray(team.players) &&
                    team.players.length > 0 &&
                    activeTournaments.find(tournament => tournament.tournamentName === team.tournamentName && tournament.tournamentDay === team.tournamentDay));
                clashSubscriptionDbImpl.retrieveAllUserDetails(Array.from(new Set(dbResponse.map(team => team.players).flat())))
                    .then(idToPlayerNameMap => {
                        dbResponse.forEach(response => payload.push(this.mapDbToDetailedApiResponse(response, idToPlayerNameMap)));
                        resolve(payload);
                    }).catch(reject);
            }).catch(reject);
        });
    }

    retrieveTeamsByServerAndTournamentsV2(serverName, activeTournaments) {
        return new Promise((resolve, reject) => {
            clashTeamsDbImpl.getTeamsV2(serverName).then(dbResponse => {
                let payload = [];
                dbResponse = dbResponse.filter(team =>
                    Array.isArray(team.players) &&
                    team.players.length > 0 &&
                    activeTournaments.find(tournament => tournament.tournamentName === team.tournamentName
                        && tournament.tournamentDay === team.tournamentDay));
                clashSubscriptionDbImpl.retrieveAllUserDetails(
                    Array.from(new Set(dbResponse.map(team => team.players).flat())))
                    .then(idToPlayerNameMap => {
                        dbResponse.forEach(response =>
                            payload.push(this.mapDbToDetailedApiResponseV2(response, idToPlayerNameMap)));
                        resolve(payload);
                    }).catch(reject);
            }).catch(reject);
        });
    }

    mapDbToDetailedApiResponse(response, idToPlayerNameMap) {
        return {
            teamName: response.teamName,
            serverName: response.serverName,
            playersDetails: Array.isArray(response.players) ? response.players.map(id => {
                let mappedPayload = {name: id};
                let foundUser = idToPlayerNameMap[id];
                if (foundUser) mappedPayload = {name: foundUser.playerName, champions: foundUser.preferredChampions}
                return mappedPayload;
            }) : {},
            tournamentDetails: {
                tournamentName: response.tournamentName,
                tournamentDay: response.tournamentDay
            },
            startTime: response.startTime,
        };
    }

    mapDbToDetailedApiResponseV2(response, idToPlayerNameMap) {
        return {
            teamName: response.teamName,
            serverName: response.serverName,
            playersDetails: Array.isArray(response.players) ? response.players.map(id => {
                let mappedPayload = {name: id};
                let foundUser = idToPlayerNameMap[id];
                let roleMap = Object.keys(response.playersWRoles).reduce((ret, key) => {
                    ret[response.playersWRoles[key]] = key;
                    return ret;
                }, {});
                if (foundUser) {
                    mappedPayload = {
                        name: foundUser.playerName,
                        role: roleMap[id],
                        id: id,
                        champions: foundUser.preferredChampions
                    };
                }
                return mappedPayload;
            }) : {},
            tournamentDetails: {
                tournamentName: response.tournamentName,
                tournamentDay: response.tournamentDay
            },
            startTime: response.startTime,
        };
    }
}

module.exports = new ClashTeamsServiceImpl;

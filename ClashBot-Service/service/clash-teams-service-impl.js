const clashTeamsDbImpl = require('../dao/clash-teams-db-impl');
const clashTentativeDbImpl = require('../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

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
                        console.log(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then(registerPlayer)
                            .catch(reject);
                    } else {
                        console.log(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
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
                        clashTeamsDbImpl.registerPlayerV2(id, role, serverName, [{
                            tournamentName: tournamentName,
                            tournamentDay: tournamentDay,
                            startTime: startTime
                        }]).then((response) => {
                            if (Array.isArray(response) && response[0].exist) {
                                resolve({error: 'Player is not eligible to create a new Team.'});
                            } else {
                                resolve(this.mapTeamDbResponseToApiResponseV2(response));
                            }
                        }).catch(reject);
                    };
                    if (isTentativeResults.onTentative) {
                        console.log(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then(registerPlayer)
                            .catch(reject);
                    } else {
                        console.log(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerPlayer();
                    }
                }).catch(reject);
        });
    }

    async mapTeamDbResponseToApiResponse(response) {
        let idToNameMap = await clashSubscriptionDbImpl.retrievePlayerNames(response.players);
        return this.mapDbToApiResponse(response, idToNameMap);
    }

    async mapTeamDbResponseToApiResponseV2(response) {
        if (Array.isArray(response)) {
            let responseArray = [];
            let ids = response.map(id => id.players);
            let idToNameMap = await clashSubscriptionDbImpl.retrievePlayerNames([...new Set(ids.flat())]);
            response.forEach((record) =>
                responseArray.push(this.mapDbToApiResponseV2(record, idToNameMap)));
            return responseArray;
        }
        else {
            let idToNameMap = await clashSubscriptionDbImpl.retrievePlayerNames(response.players);
            return this.mapDbToApiResponseV2(response, idToNameMap);
        }
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

    mapDbToApiResponseV2(response, idToNameMap) {
        let mappedResponse = {
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
            playersRoleDetails: {}
        };
        let keys = Object.keys(response.playersWRoles);
        for (let key in keys) {
            mappedResponse.playersRoleDetails[keys[key]] = idToNameMap[response.playersWRoles[keys[key]]]
        }
        return mappedResponse;
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
                        console.log(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, tentativeResults.tentativeList)
                            .then(registerWithSpecificTeam)
                            .catch(reject);
                    } else {
                        console.log(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
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
                        if (!dbResponse) {
                            resolve({error: 'Unable to find the Team requested to be persisted.'});
                        } else {
                            resolve(this.mapTeamDbResponseToApiResponseV2(dbResponse));
                        }
                    }).catch(reject);
            }
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(tentativeResults => {
                    if (tentativeResults.onTentative) {
                        console.log(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, tentativeResults.tentativeList)
                            .then(registerWithSpecificTeamV2)
                            .catch(reject);
                    } else {
                        console.log(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
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
                        resolve(this.mapTeamDbResponseToApiResponseV2(dbResponse));
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
        let mappedResponse = {
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
        return mappedResponse;
    }
}

module.exports = new ClashTeamsServiceImpl;

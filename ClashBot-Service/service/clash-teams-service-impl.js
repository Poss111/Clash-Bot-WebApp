const clashTeamsDbImpl = require('../dao/clash-teams-db-impl');
const clashTentativeDbImpl = require('../dao/clash-tentative-db-impl');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

class ClashTeamsServiceImpl {
    createNewTeam(id, serverName, tournamentName, tournamentDay, startTime) {
        return new Promise((resolve) => {
            clashTentativeDbImpl.isTentative(id, serverName,
                {tournamentName: tournamentName, tournamentDay: tournamentDay})
                .then(isTentativeResults => {
                    let registerPlayer = () => {
                        clashTeamsDbImpl.registerPlayer(id, serverName, [{
                            tournamentName: tournamentName,
                            tournamentDay: tournamentDay,
                            startTime: startTime
                        }]).then((response) => {
                            if (response.exist) {
                                resolve({error: 'Player is not eligible to create a new Team.'});
                            } else {
                                this.mapTeamDbResponseToApiResponse(response, resolve);
                            }
                        });
                    };
                    if (isTentativeResults.onTentative) {
                        console.log(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then(registerPlayer);
                    } else {
                        console.log(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerPlayer();
                    }
                });
        });
    }

    mapTeamDbResponseToApiResponse(response, resolve) {
        clashSubscriptionDbImpl.retrievePlayerNames(response.players).then(idsToPlayerNameMap => {
            resolve({
                teamName: response.teamName,
                serverName: response.serverName,
                playersDetails: Array.isArray(response.players) ? response.players.map(data => {
                    return {name: !idsToPlayerNameMap[data] ? data : idsToPlayerNameMap[data]}
                }) : {},
                tournamentDetails: {
                    tournamentName: response.tournamentName,
                    tournamentDay: response.tournamentDay
                },
                startTime: response.startTime,
            });
        });
    }

    registerWithTeam(id, teamName, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve) => {
            let registerWithSpecificTeam = () => {
                clashTeamsDbImpl.registerWithSpecificTeam(id, serverName, [{
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                }], teamName)
                    .then((dbResponse) => {
                        if (!dbResponse) {
                            resolve({error: 'Unable to find the Team requested to be persisted.'});
                        } else {
                            this.mapTeamDbResponseToApiResponse(dbResponse, resolve);
                        }
                    });
            }
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(tentativeResults => {
                    if (tentativeResults.onTentative) {
                        console.log(`('${id}') found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), removing...`);
                        clashTentativeDbImpl.removeFromTentative(id, tentativeResults.tentativeList)
                            .then(registerWithSpecificTeam);
                    } else {
                        console.log(`('${id}') not found on Tentative for Tournament ('${tournamentName}') ('${tournamentDay}'), skipping tentative removal...`);
                        registerWithSpecificTeam();
                    }
                })
        });
    }

    unregisterFromTeam(id, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve) => {
            clashTeamsDbImpl.deregisterPlayer(id, serverName, [{
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            }])
                .then(dbResponse => {
                    if (!dbResponse) resolve({ error: 'User not found on requested Team.' });
                    else this.mapTeamDbResponseToApiResponse(dbResponse, resolve);
                })
            ;
        });
    }

    retrieveTeamsByServerAndTournaments() {
        return new Promise(() => {
        });
    }

}

module.exports = new ClashTeamsServiceImpl;

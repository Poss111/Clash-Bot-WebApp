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
                            clashSubscriptionDbImpl.retrievePlayerNames([response.players[0]]).then(idsToPlayerNameMap => {
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

    registerWithTeam() {
        return new Promise(() => {
        });
    }

    unregisterFromTeam() {
        return new Promise(() => {
        });
    }

    retrieveTeamsByServerAndTournaments() {
        return new Promise(() => {
        });
    }

}

module.exports = new ClashTeamsServiceImpl;

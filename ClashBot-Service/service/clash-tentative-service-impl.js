const clashTentativeDbImpl = require('../dao/clash-tentative-db-impl');
const clashTeamsServiceImpl = require('../service/clash-teams-service-impl');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

class ClashTentativeServiceImpl {

    async mapToApiResponse(tentativeDbResponse) {
        if (Array.isArray(tentativeDbResponse.tentativePlayers) && tentativeDbResponse.tentativePlayers.length > 0) {
            const idToPlayerNameMap = await clashSubscriptionDbImpl.retrievePlayerNames(tentativeDbResponse.tentativePlayers);
            return {
                serverName: tentativeDbResponse.serverName,
                tournamentDetails: tentativeDbResponse.tournamentDetails,
                tentativePlayers: Array.isArray(tentativeDbResponse.tentativePlayers) ? tentativeDbResponse.tentativePlayers.map(data => {
                    return !idToPlayerNameMap[data] ? data : idToPlayerNameMap[data]
                }) : []
            };
        }
    }

    handleTentativeRequest(id, serverName, tournamentName, tournamentDay) {
        return new Promise(resolve => {
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(isTentativeResults => {
                    if (!isTentativeResults.onTentative) {
                        clashTeamsServiceImpl.unregisterFromTeam(id, serverName, tournamentName, tournamentDay)
                            .then(() => {
                                clashTentativeDbImpl.addToTentative(id, serverName, {tournamentName: tournamentName, tournamentDay: tournamentDay}, isTentativeResults.tentativeList)
                                    .then((addTentativeDbResponse) => {
                                        resolve(this.mapToApiResponse(addTentativeDbResponse))
                                    });
                            });
                    } else {
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then((removeTentativeDbResponse) => {
                                resolve(this.mapToApiResponse(removeTentativeDbResponse))
                            });
                    }
                })
        });
    }

}

module.exports = new ClashTentativeServiceImpl;

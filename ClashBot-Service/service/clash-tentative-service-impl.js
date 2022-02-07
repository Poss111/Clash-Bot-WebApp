const clashTentativeDbImpl = require('../dao/clash-tentative-db-impl');
const clashTeamsServiceImpl = require('../service/clash-teams-service-impl');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

class ClashTentativeServiceImpl {

    async mapToApiResponse(tentativeDbResponse) {
        let mappedApiResponse = {
            serverName: tentativeDbResponse.serverName,
            tournamentDetails: tentativeDbResponse.tournamentDetails
        };
        let idToPlayerNameMap = {};
        if (Array.isArray(tentativeDbResponse.tentativePlayers) && tentativeDbResponse.tentativePlayers.length > 0) {
            idToPlayerNameMap = await clashSubscriptionDbImpl.retrievePlayerNames(tentativeDbResponse.tentativePlayers);
        }
        mappedApiResponse.tentativePlayers = Array.isArray(tentativeDbResponse.tentativePlayers) ? tentativeDbResponse.tentativePlayers.map(data => {
            return !idToPlayerNameMap[data] ? data : idToPlayerNameMap[data]
        }) : [];
        return mappedApiResponse;
    }

    mapToApiResponseV2(tentativeDbResponse) {
        return new Promise((resolve, reject) => {
            let mappedApiResponse = {
                serverName: tentativeDbResponse.serverName,
                tournamentDetails: tentativeDbResponse.tournamentDetails
            };
            let idToPlayerNameMap = {};
            if (Array.isArray(tentativeDbResponse.tentativePlayers) && tentativeDbResponse.tentativePlayers.length > 0) {
                clashSubscriptionDbImpl.retrievePlayerNames(tentativeDbResponse.tentativePlayers)
                    .then((idToPlayerNameMap) => {
                        mappedApiResponse.tentativePlayers = Array.isArray(tentativeDbResponse.tentativePlayers) ? tentativeDbResponse.tentativePlayers.map(data => {
                            return !idToPlayerNameMap[data] ? data : idToPlayerNameMap[data]
                        }) : [];
                        resolve(mappedApiResponse);
                    });
            } else {
                resolve(mappedApiResponse);
            }
        });
    }

    handleTentativeRequest(id, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(isTentativeResults => {
                    if (!isTentativeResults.onTentative) {
                        clashTeamsServiceImpl.unregisterFromTeam(id, serverName, tournamentName, tournamentDay)
                            .then(() => {
                                clashTentativeDbImpl.addToTentative(id, serverName, {
                                    tournamentName: tournamentName,
                                    tournamentDay: tournamentDay
                                }, isTentativeResults.tentativeList)
                                    .then((addTentativeDbResponse) => {
                                        resolve(this.mapToApiResponse(addTentativeDbResponse))
                                    }).catch(reject);
                            }).catch(reject);
                    } else {
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then((removeTentativeDbResponse) => {
                                resolve(this.mapToApiResponse(removeTentativeDbResponse))
                            }).catch(reject);
                    }
                })
                .catch(reject);
        });
    }

    handleTentativeRequestV2(id, serverName, tournamentName, tournamentDay) {
        return new Promise((resolve, reject) => {
            clashTentativeDbImpl.isTentative(id, serverName, {
                tournamentName: tournamentName,
                tournamentDay: tournamentDay
            })
                .then(isTentativeResults => {
                    if (!isTentativeResults.onTentative) {
                        clashTeamsServiceImpl.unregisterFromTeamV2(id, serverName, tournamentName, tournamentDay)
                            .then((teamsUnregistered) => {
                                clashTentativeDbImpl.addToTentative(id, serverName, {
                                    tournamentName: tournamentName,
                                    tournamentDay: tournamentDay
                                }, isTentativeResults.tentativeList)
                                    .then((addTentativeDbResponse) => {
                                        this.mapToApiResponseV2(addTentativeDbResponse)
                                            .then((mappedApiResponse) => {
                                                resolve({
                                                    tentativeDetails: mappedApiResponse,
                                                    unregisteredTeams: teamsUnregistered
                                                })
                                            })
                                    }).catch(reject);
                            }).catch(reject);
                    } else {
                        clashTentativeDbImpl.removeFromTentative(id, isTentativeResults.tentativeList)
                            .then((removeTentativeDbResponse) => {
                                this.mapToApiResponseV2(removeTentativeDbResponse)
                                    .then((mappedApiResponse) => {
                                        resolve({
                                            tentativeDetails: mappedApiResponse,
                                            unregisteredTeams: []
                                        })
                                    })
                            }).catch(reject);
                    }
                })
                .catch(reject);
        });
    }

}

module.exports = new ClashTentativeServiceImpl;

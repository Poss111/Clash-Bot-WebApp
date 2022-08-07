const deepCopy = (object) => JSON.parse(JSON.stringify(object));

function createV3Team({
  serverName, teamName = 'abra', tournamentName = 'awesome_sauce', tournamentDay = '1', playersWRoles = {}, players = [],
}) {
  return {
    details: `${tournamentName}#${tournamentDay}#${teamName}`,
    teamName,
    serverName,
    players,
    playersWRoles,
    tournamentName,
    tournamentDay,
    startTime: new Date().toISOString(),
  };
}

function createUserDetails({
  key = '1', playerName = 'Roid', serverName = 'Goon Squad', preferredChampions = ['Braum', 'Mordekaiser', 'Lissandra'],
}) {
  return {
    key,
    playerName,
    serverName,
    timeAdded: new Date().toISOString(),
    preferredChampions,
  };
}

function buildExpectedTeamResponseWithUserMap(expectedTeams, mockUserDetails) {
  return {
    code: 200,
    payload: expectedTeams.map((team) => {
      const mappedTeam = {
        name: team.teamName,
        serverName: team.serverName,
        tournament: {
          tournamentName: team.tournamentName,
          tournamentDay: team.tournamentDay,
        },
      };
      if (team.playersWRoles) {
        mappedTeam.playerDetails = Object.entries(team.playersWRoles)
          .reduce((ret, entry) => {
            const foundUser = mockUserDetails[entry[1]];
            ret[entry[0]] = {
              id: entry[1],
              name: foundUser.playerName,
              champions: foundUser.preferredChampions,
            };
            return ret;
          }, {});
      }
      return mappedTeam;
    }),
  };
}

module.exports = {
  deepCopy,
  createV3Team,
  createUserDetails,
  buildExpectedTeamResponseWithUserMap,
};

module.exports = {
  Items: [
    {
      startTime: ':currentDateOne',
      tournamentDay: ':tournamentDayOne',
      key: ':tournamentName#:tournamentDayOne',
      tournamentName: ':tournamentName',
      registrationTime: ':currentDateOne',
    },
    {
      startTime: ':datePlusOneDay',
      tournamentDay: ':tournamentDayTwo',
      key: ':tournamentName#:tournamentDayTwo',
      tournamentName: ':tournamentName',
      registrationTime: ':datePlusOneDay',
    },
    {
      startTime: ':datePlusTwoDays',
      tournamentDay: ':tournamentDayThree',
      key: ':tournamentName#:tournamentDayThree',
      tournamentName: ':tournamentName',
      registrationTime: ':datePlusTwoDays',
    },
    {
      startTime: ':datePlusThreeDays',
      tournamentDay: ':tournamentDayFour',
      key: ':tournamentName#:tournamentDayFour',
      tournamentName: ':tournamentName',
      registrationTime: ':datePlusThreeDays',
    },
    {
      startTime: ':datePlusFourDays',
      tournamentDay: ':tournamentDayFive',
      key: ':tournamentNameTwo#:tournamentDayFive',
      tournamentName: ':tournamentNameTwo',
      registrationTime: ':datePlusFourDays',
    },
  ],
};

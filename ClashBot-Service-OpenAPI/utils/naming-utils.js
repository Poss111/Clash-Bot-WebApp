const randomNameList = require('./random-names');

const retrieveName = () => randomNameList[Math.floor(Math.random() * randomNameList.length)];

module.exports.retrieveName = retrieveName;

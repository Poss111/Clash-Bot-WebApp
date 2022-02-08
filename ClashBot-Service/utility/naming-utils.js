const randomNameList = require('../random-names');

let retrieveName = () => {
    return randomNameList[Math.floor(Math.random() * randomNameList.length)];
}

module.exports.retrieveName = retrieveName;

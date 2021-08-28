let deepCopy = (object) => JSON.parse(JSON.stringify(object));

module.exports.deepCopy = deepCopy;
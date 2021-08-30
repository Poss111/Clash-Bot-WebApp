let errorHandler = (res, message) => {
    res.statusCode = 500;
    if (!message) {
        message = 'Failed to execute command. Please check logs.';
    }
    res.json({ error: message });
}

let badRequestHandler = (res, message) => {
    res.statusCode = 400;
    res.json({error: message});
}

module.exports.errorHandler = errorHandler;
module.exports.badRequestHandler = badRequestHandler;
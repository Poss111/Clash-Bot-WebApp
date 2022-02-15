const { startUpApp } = require('./application');
const logger = require('pino')();
const port = process.env.PORT ? process.env.PORT : 81;

startUpApp().then(app => {
    app.listen(port, () => {
        logger.info(`Clash Bot Notification Service up and running on Port ('${port}')!`);
    });
});


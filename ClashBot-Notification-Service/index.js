const { startUpApp } = require('./application');
const logger = require('pino')();
const port = 80;

startUpApp().then(app => {
    app.listen(port, () => {
        logger.info(`Clash Bot Service up and running on Port ('${port}')!`);
    });
});


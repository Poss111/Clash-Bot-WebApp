const { startUpApp } = require('./application');
const logger = require('pino')();
const port = 80;

startUpApp().then(app => {
    app.listen(port, () => {
        app._router.stack.forEach(function(r){
            if (r.route && r.route.path){
                logger.info(r.route.path)
            }
        })
        logger.info(`Clash Bot Service up and running on Port ('${port}')!`);
    });
});


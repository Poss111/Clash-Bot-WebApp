const dynamodb = require('dynamodb');
const logger = require('./../../logger');

class DynamoDbHelper {

    setupConfig;

    initialize(tableName, tableDef) {
        return new Promise((resolve) => {
            if (!this.setupConfig) {
                if (process.env.INTEGRATION_TEST) {
                    logger.info('Loading credentials for Integration Test.');
                    if (!process.env.HOST) {
                        process.env.HOST = 'localhost';
                    }
                    logger.info(`HOST : ${process.env.HOST}`);
                    dynamodb.AWS.config.update({
                        region: `${process.env.REGION}`,
                        endpoint: `http://${process.env.HOST}:8000`,
                        accessKeyId: 'Dummy',
                        secretAccessKey: 'Dummy',
                        httpOptions: {
                            connectTimeout: 2000,
                            timeout: 2000
                        }
                    });
                } else if (process.env.LOCAL) {
                    logger.info('Loading credentials for local.');
                    dynamodb.AWS.config.loadFromPath('./credentials.json');
                } else {
                    logger.info('Loading credentials for remote.');
                    dynamodb.AWS.config.update({
                        region: `${process.env.REGION}`
                    });
                }
                this.setupConfig = true;
            }
            logger.info(`Loaded table def ('${tableName}').`);
            resolve(dynamodb.define(tableName, tableDef));
        })
    }
}

module.exports = new DynamoDbHelper;

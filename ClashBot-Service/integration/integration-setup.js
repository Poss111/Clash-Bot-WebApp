let dynamoDbUtility = require('./dynamo-db-utility.setup');

process.env.INTEGRATION_TEST = true;
process.env.REGION = 'us-east-1';

let clashTableData = new Map();

delete process.env.LOCAL;
delete process.env.TOKEN;

let promise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
        reject(new Error('Failed to load db data in set time.'))
    }, 28000);

    dynamoDbUtility.loadAllTables()
        .then(data => {
            console.log('Table data setup successfully.');
            clashTableData = data;
            clearTimeout(timer);
            resolve(data);
        }).catch(err => {
        clearTimeout(timer);
        console.error('Failed to setup data', err);
        reject(err);
    });
});
promise.then(() => {
    console.log('Successfully setup table data.');
    clashTableData.forEach((value, key) => {
        console.log(`${key} => ${JSON.stringify(value)}`);
    });
}).catch((err) => {
    console.error('Failed to load DB data for setup.', err);
    process.exit(1);
});

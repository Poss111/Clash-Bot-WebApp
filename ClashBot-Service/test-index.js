require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = 80;
const urlPrefix = '/api';

let startApp = () => {
    const app = express();

    app.use(cors());

    app.use((req, res, next) => {
        console.log(`Request Path ('${req.url}') Method ('${req.method}')`)
        next();
        console.log(`Response Path ('${req.url}') Status Code ('${res.statusCode}')`);
    });

    app.get(`${urlPrefix}/test`, (req, res) => {
        res.statusCode = 404;
        return res.json({ status: 'Done'});
    })

    app.use((req, res, next) => {
        console.error(`Path not found ('${req.url}')`)
        res.status(404).send("Sorry can't find that!");
        next();
    })

    return app;
}

module.exports = startApp;

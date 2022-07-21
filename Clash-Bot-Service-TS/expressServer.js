// const { Middleware } = require('swagger-express-middleware');
const http = require('http');
const fs = require('fs');
const path = require('path');
const swaggerUI = require('swagger-ui-express');
const jsYaml = require('js-yaml');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const OpenApiValidator = require('express-openapi-validator');
const pino = require('pino-http')();
const logger = require('./logger');

class ExpressServer {
  constructor(port, openApiYaml) {
    this.port = port;
    this.app = express();
    this.openApiPath = openApiYaml;
    try {
      this.schema = jsYaml.safeLoad(fs.readFileSync(openApiYaml));
    } catch (e) {
      logger.error('failed to start Express Server', e.message);
    }
    this.setupMiddleware();
  }

  setupMiddleware() {
    // this.setupAllowedMedia();
    this.app.use(cors());
    this.app.use(pino);
    this.app.use(bodyParser.json({ limit: '14MB' }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());

    this.app.use(OpenApiValidator.middleware({
      apiSpec: this.openApiPath,
      validateRequests: true, // (default)
      // validateResponses: true, // false by default
      operationHandlers: path.join(__dirname),
    }));

    this.app.use((err, req, res, next) => {
      // format error
      res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
      });
    });
    // View the openapi document in a visual interface. Should be able to test from this page
    this.app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(this.schema));
  }

  launch() {
    http.createServer(this.app).listen(this.port);
    console.log(`Listening on port ${this.port}`);
  }

  async close() {
    if (this.server !== undefined) {
      await this.server.close();
      console.log(`Server on port ${this.port} shut down`);
    }
  }
}

module.exports = ExpressServer;

const logger = require("../logger");

class Service {
  static rejectResponse(error, code = 500) {
    return {error, code};
  }

  static successResponse(payload, code = 200) {
    return {payload, code};
  }

  static handleException({ error, reject, loggerContext = { class: 'Unknown', method: 'Unknown' } }) {
    loggerContext.err = error;
    logger.error(loggerContext, 'Failed to fulfill call.');
    reject(Service.rejectResponse(
      'Something went wrong.',
      500,
    ));
  }
}

module.exports = Service;

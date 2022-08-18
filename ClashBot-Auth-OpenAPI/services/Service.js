const logger = require('../logger');

class Service {
  static rejectResponse(error, code = 500) {
    return { error, code };
  }

  static successResponse(payload, code = 200) {
    return { payload, code };
  }

  static handleException({ err, reject, loggerContext = { class: 'Unknown', method: 'Unknown' } }) {
    logger.error({ loggerContext, error: { message: err.message, stack: err.stack } }, 'Failed to fulfill call.');
    reject(Service.rejectResponse(
      'Something went wrong.',
      500,
    ));
  }
}

module.exports = Service;

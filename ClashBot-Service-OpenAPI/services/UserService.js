/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashSubscriptionDbImpl = require('../dao/ClashUserDbImpl');
const {
  userEntityToResponse,
  requestToUserEntity,
  requestToNewUserEntity,
} = require('../mappers/UserMapper');

/**
 * Retrieve a Clash Bot Player Details
 *
 * id Integer The id of the user to retrieve.
 * returns Player
 * */
const getUser = ({ id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'getUser' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.',
          404));
      } else {
        resolve(Service.successResponse(objectMapper(userDetails,
          userEntityToResponse)));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Create a new Clash Bot Player.
 *
 * player Player  (optional)
 * returns Player
 * */
const updateUser = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'updateUser' };
    try {
      const updatedUser = await clashSubscriptionDbImpl.updateUser(objectMapper(body,
        requestToUserEntity));
      resolve(Service.successResponse(objectMapper(updatedUser,
        userEntityToResponse)));
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Adds the requested champion to the users preferred champions.
 *
 * body String
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const addToListOfPreferredChampions = ({ body, id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'addToListOfPreferredChampions' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.',
          404));
      } else if (Array.isArray(userDetails.preferredChampions)
        && userDetails.preferredChampions.length >= 5) {
        reject(Service
          .rejectResponse('Too many champions. Must be less than or equal to 5.', 400));
      } else {
        const updateUserDetails = {
          key: userDetails.key,
          preferredChampions: userDetails.preferredChampions,
        };
        if (!userDetails.preferredChampions) {
          updateUserDetails.preferredChampions = [body.championName];
        } else {
          updateUserDetails.preferredChampions.push(body.championName);
        }
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(updateUserDetails);
        resolve(Service.successResponse(updatedUserDetails.preferredChampions));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Updates the users preferred champions with an entirely new list.
 *
 * string List
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const createNewListOfPreferredChampions = ({ body, id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'createNewListOfPreferredChampions' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.',
          404));
      } else if (body.champions.length > 5) {
        reject(Service.rejectResponse('Too many champions. Must be less than or equal to 5.',
          400));
      } else {
        const userDetailsCopy = {
          key: userDetails.key,
          preferredChampions: body.champions,
        };
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(userDetailsCopy);
        resolve(Service.successResponse(updatedUserDetails.preferredChampions));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Create a new Clash Bot Player.
 *
 * createUserRequest CreateUserRequest
 * returns Player
 * */
const createUser = ({ body }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'createUser' };
    try {
      const createdUserEntity = await clashSubscriptionDbImpl
        .createUser(objectMapper(body, requestToNewUserEntity));
      resolve(Service.successResponse(objectMapper(createdUserEntity,
        userEntityToResponse)));
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Removes the requested champion to the users preferred champions.
 *
 * id String The Clash bot Player's id (optional)
 * champion the champion name to remove from the user's list of champions.
 * returns List
 * */
const removeFromListOfPreferredChampions = ({ id, champion }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'removeFromListOfPreferredChampions' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.',
          404));
      } else if (!userDetails.preferredChampions || userDetails
        .preferredChampions
        .length <= 0) {
        resolve(Service.successResponse([]));
      } else {
        const updatedUserDetails = {
          key: userDetails.key,
          preferredChampions: userDetails.preferredChampions,
        };
        updatedUserDetails.preferredChampions = userDetails
          .preferredChampions
          .filter((record) => record.toLowerCase() !== champion.toLowerCase());
        if (updatedUserDetails
          .preferredChampions
          .join() === userDetails
          .preferredChampions
          .join()) {
          resolve(Service.successResponse(updatedUserDetails.preferredChampions));
        } else {
          const returnedUserDetails = await clashSubscriptionDbImpl.updateUser(updatedUserDetails);
          let payload = returnedUserDetails.preferredChampions;
          if (!payload) {
            payload = [];
          }
          resolve(Service.successResponse(payload));
        }
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);
/**
 * Returns a list of preferred champions that the User has.
 *
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const retrieveListOfUserPreferredChampions = ({ id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'retrieveListOfUserPreferredChampions' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.',
          404));
      } else {
        const payload = userDetails.preferredChampions ? userDetails
          .preferredChampions : [];
        resolve(Service.successResponse(payload));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Returns if the user is subscribed to receive Monday morning Discord DMs.
 *
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const retrieveUserSubscriptions = ({ id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'retrieveUserSubscriptions' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.',
          404));
      } else {
        resolve(Service.successResponse(objectMapper(userDetails,
          userEntityToResponse).subscriptions));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Adds user to Monday morning subscription
 *
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const subscribeUser = ({ id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'subscribeUser' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.', 404));
      } else if (userDetails.subscribed) {
        resolve(Service.successResponse(
          objectMapper(userDetails, userEntityToResponse).subscriptions,
        ));
      } else {
        const updatedUser = {
          key: userDetails.key,
          subscribed: 'true',
        };
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(updatedUser);
        resolve(Service.successResponse(
          objectMapper(updatedUserDetails, userEntityToResponse).subscriptions,
        ));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

/**
 * Removes user from Monday morning subscription.
 *
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const unsubscribeUser = ({ id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'unsubscribeUser' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('Resource not found.', 404));
      } else if (!userDetails.subscribed) {
        resolve(Service.successResponse(
          objectMapper(userDetails, userEntityToResponse).subscriptions,
        ));
      } else {
        const updatedUser = {
          key: userDetails.key,
          subscribed: '',
        };
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(updatedUser);
        resolve(Service.successResponse(
          objectMapper(updatedUserDetails, userEntityToResponse).subscriptions,
        ));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        err: error,
        reject,
      });
    }
  },
);

module.exports = {
  getUser,
  updateUser,
  createUser,
  retrieveListOfUserPreferredChampions,
  addToListOfPreferredChampions,
  createNewListOfPreferredChampions,
  removeFromListOfPreferredChampions,
  retrieveUserSubscriptions,
  subscribeUser,
  unsubscribeUser,
};

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
        reject(Service.rejectResponse('User not found.',
          204));
      } else {
        resolve(Service.successResponse(objectMapper(userDetails,
          userEntityToResponse)));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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
        error,
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
        reject(Service.rejectResponse('User not found.',
          400));
      } else if (Array.isArray(userDetails.preferredChampions)
        && userDetails.preferredChampions.length >= 5) {
        reject(Service
          .rejectResponse('Too many champions. Must be less than or equal to 5.', 204));
      } else {
        if (!userDetails.preferredChampions) {
          userDetails.preferredChampions = [body.championName];
        } else {
          userDetails.preferredChampions.push(body.championName);
        }
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(userDetails);
        resolve(Service.successResponse(updatedUserDetails.preferredChampions));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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
        reject(Service.rejectResponse('User not found.',
          400));
      } else if (body.champions.length >= 5) {
        reject(Service.rejectResponse('Too many champions. Must be less than or equal to 5.',
          204));
      } else {
        const userDetailsCopy = JSON.parse(JSON.stringify(userDetails));
        userDetailsCopy.preferredChampions = body.champions;
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(userDetailsCopy);
        resolve(Service.successResponse(updatedUserDetails.preferredChampions));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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
const createUser = ({ createUserRequest }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'createUser' };
    try {
      const createdUserEntity = await clashSubscriptionDbImpl
        .createUser(objectMapper(createUserRequest, requestToNewUserEntity));
      resolve(Service.successResponse(objectMapper(createdUserEntity,
        userEntityToResponse)));
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
        reject,
      });
    }
  },
);

/**
 * Removes the requested champion to the users preferred champions.
 *
 * body String
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
const removeFromListOfPreferredChampions = ({ body, id }) => new Promise(
  async (resolve, reject) => {
    const loggerContext = { class: 'UserService', method: 'removeFromListOfPreferredChampions' };
    try {
      const userDetails = await clashSubscriptionDbImpl.retrieveUserDetails(id);
      if (!userDetails || !userDetails.key) {
        reject(Service.rejectResponse('User not found.',
          400));
      } else if (!userDetails.preferredChampions || userDetails
        .preferredChampions
        .length <= 0) {
        resolve(Service.successResponse([]));
      } else {
        const updatedUserDetails = JSON.parse(JSON.stringify(userDetails));
        updatedUserDetails.preferredChampions = userDetails
          .preferredChampions
          .filter((record) => record.toLowerCase() !== body.championName.toLowerCase());
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
        error,
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
        reject(Service.rejectResponse('User not found.',
          400));
      } else {
        const payload = userDetails.preferredChampions ? userDetails
          .preferredChampions : [];
        resolve(Service.successResponse(payload));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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
        reject(Service.rejectResponse('User not found.',
          400));
      } else {
        resolve(Service.successResponse(objectMapper(userDetails,
          userEntityToResponse).subscriptions));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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
        reject(Service.rejectResponse('User not found.', 400));
      } else if (userDetails.subscribed) {
        resolve(Service.successResponse(
          objectMapper(userDetails, userEntityToResponse).subscriptions,
        ));
      } else {
        const updatedUser = { ...userDetails };
        updatedUser.subscribed = 'true';
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(updatedUser);
        resolve(Service.successResponse(
          objectMapper(updatedUserDetails, userEntityToResponse).subscriptions,
        ));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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
        reject(Service.rejectResponse('User not found.', 400));
      } else if (!userDetails.subscribed) {
        resolve(Service.successResponse(
          objectMapper(userDetails, userEntityToResponse).subscriptions,
        ));
      } else {
        const updatedUser = { ...userDetails };
        updatedUser.subscribed = '';
        const updatedUserDetails = await clashSubscriptionDbImpl.updateUser(updatedUser);
        resolve(Service.successResponse(
          objectMapper(updatedUserDetails, userEntityToResponse).subscriptions,
        ));
      }
    } catch (error) {
      Service.handleException({
        loggerContext,
        error,
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

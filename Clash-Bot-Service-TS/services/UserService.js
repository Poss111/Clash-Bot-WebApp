/* eslint-disable no-unused-vars */
const objectMapper = require('object-mapper');
const Service = require('./Service');
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');
const { userEntityToResponse, requestToUserEntity, requestToNewUserEntity } = require('../mappers/UserMapper');

/**
* Retrieve a Clash Bot Player Details
*
* id Integer The id of the user to retrieve.
* returns Player
* */
const getUser = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
        if (!userDetails || !userDetails.key) {
          reject(Service.rejectResponse('User not found.', 204));
        } else {
          resolve(Service.successResponse(objectMapper(userDetails, userEntityToResponse)));
        }
      }).catch((e) => reject(Service.rejectResponse(
        e.message || 'Something unexpected happened.',
        e.status || 500,
      )));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      clashSubscriptionDbImpl.updateUser(objectMapper(body, requestToUserEntity))
        .then((updatedUser) => {
          resolve(Service.successResponse(objectMapper(updatedUser, userEntityToResponse)));
        }).catch((e) => {
          reject(Service.rejectResponse(
            e.message || 'Something unexpected happened.',
            e.status || 500,
          ));
        });
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
        if (!userDetails || !userDetails.key) {
          reject(Service.rejectResponse('User not found.', 400));
        } else {
          if (!userDetails.preferredChampions) {
            userDetails.preferredChampions = [body.championName];
          } else {
            userDetails.preferredChampions.push(body.championName);
          }
          clashSubscriptionDbImpl.updateUser(userDetails).then((updatedUserDetails) => {
            resolve(Service.successResponse(updatedUserDetails.preferredChampions));
          });
        }
      }).catch((err) => reject(Service.rejectResponse(
        err.message || 'Something went wrong',
        err.status || 405,
      )));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      clashSubscriptionDbImpl.retrieveUserDetails(id)
        .then((userDetails) => {
          if (!userDetails || !userDetails.key) {
            reject(Service.rejectResponse('User not found.', 400));
          } else {
            const userDetailsCopy = JSON.parse(JSON.stringify(userDetails));
            userDetailsCopy.preferredChampions = body.champions;
            clashSubscriptionDbImpl.updateUser(userDetailsCopy)
              .then((updatedUserDetails) => resolve(Service.successResponse(updatedUserDetails.preferredChampions)))
              .catch((e) => {
                reject(Service.rejectResponse(
                  e.message || 'Something unexpected happened',
                  e.status || 500,
                ));
              });
          }
        }).catch((e) => {
          reject(Service.rejectResponse(
            e.message || 'Something unexpected happened',
            e.status || 500,
          ));
        });
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

/**
 * Create a new Clash Bot Player.
 *
 * createUserRequest CreateUserRequest
 * returns Player
 * */
// TODO - createUser
const createUser = ({ createUserRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      clashSubscriptionDbImpl.createUser(objectMapper(createUserRequest, requestToNewUserEntity))
        .then((createdUserEntity) => resolve(Service.successResponse(objectMapper(createdUserEntity, userEntityToResponse))))
        .catch((e) => reject(Service.rejectResponse(
          e.message || 'Something went wrong',
          e.status || 500,
        )));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
        if (!userDetails || !userDetails.key) {
          reject(Service.rejectResponse('User not found.', 400));
        } else if (!userDetails.preferredChampions || userDetails.preferredChampions.length <= 0) {
          resolve(Service.successResponse([]));
        } else {
          const updatedUserDetails = JSON.parse(JSON.stringify(userDetails));
          updatedUserDetails.preferredChampions = userDetails.preferredChampions.filter((record) => record.toLowerCase() !== body.championName.toLowerCase());
          if (updatedUserDetails.preferredChampions.join() === userDetails.preferredChampions.join()) {
            resolve(Service.successResponse(updatedUserDetails.preferredChampions));
          } else {
            clashSubscriptionDbImpl.updateUser(updatedUserDetails).then((returnedUserDetails) => {
              let payload = returnedUserDetails.preferredChampions;
              if (!payload) {
                payload = [];
              }
              resolve(Service.successResponse(payload));
            }).catch((err) => {
              reject(Service.rejectResponse(
                err.message || 'Something went wrong',
                err.status || 500,
              ));
            });
          }
        }
      }).catch((err) => {
        reject(Service.rejectResponse(
          err.message || 'Something went wrong',
          err.status || 500,
        ));
      });
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
        if (!userDetails || !userDetails.key) {
          reject(Service.rejectResponse('User not found.', 400));
        }
        const payload = userDetails.preferredChampions ? userDetails.preferredChampions : [];
        resolve(Service.successResponse(payload));
      }).catch((e) => reject(Service.rejectResponse(
        e.message || 'Something unexpected happened.',
        e.status || 500,
      )));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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
    try {
      clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
        if (!userDetails || !userDetails.key) {
          reject(Service.rejectResponse('User not found.', 400));
        } else {
          resolve(Service.successResponse(objectMapper(userDetails, userEntityToResponse).subscriptions));
        }
      }).catch((err) => {
        reject(Service.rejectResponse(
          err.message || 'Something went wrong.',
          err.status || 500,
        ));
      });
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 500,
      ));
    }
  },
);

/**
 * Adds user to Monday morning subscription
 *
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
// TODO - subscribeUser
const subscribeUser = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

/**
 * Removes user from Monday morning subscription.
 *
 * id String The Clash bot Player's id (optional)
 * returns List
 * */
// TODO - unsubscribeUser
const unsubscribeUser = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
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

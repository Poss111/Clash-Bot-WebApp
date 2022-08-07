/**
 * The UserController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/UserService');
const addToListOfPreferredChampions = async (request, response) => {
  await Controller.handleRequest(request, response, service.addToListOfPreferredChampions);
};

const createNewListOfPreferredChampions = async (request, response) => {
  await Controller.handleRequest(request, response, service.createNewListOfPreferredChampions);
};

const createUser = async (request, response) => {
  await Controller.handleRequest(request, response, service.createUser);
};

const getUser = async (request, response) => {
  await Controller.handleRequest(request, response, service.getUser);
};

const removeFromListOfPreferredChampions = async (request, response) => {
  await Controller.handleRequest(request, response, service.removeFromListOfPreferredChampions);
};

const retrieveListOfUserPreferredChampions = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveListOfUserPreferredChampions);
};

const retrieveUserSubscriptions = async (request, response) => {
  await Controller.handleRequest(request, response, service.retrieveUserSubscriptions);
};

const subscribeUser = async (request, response) => {
  await Controller.handleRequest(request, response, service.subscribeUser);
};

const unsubscribeUser = async (request, response) => {
  await Controller.handleRequest(request, response, service.unsubscribeUser);
};

const updateUser = async (request, response) => {
  await Controller.handleRequest(request, response, service.updateUser);
};


module.exports = {
  addToListOfPreferredChampions,
  createNewListOfPreferredChampions,
  createUser,
  getUser,
  removeFromListOfPreferredChampions,
  retrieveListOfUserPreferredChampions,
  retrieveUserSubscriptions,
  subscribeUser,
  unsubscribeUser,
  updateUser,
};

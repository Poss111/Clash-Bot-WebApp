const errorHandler = require('../error-handler')

describe('Error Handling', () => {
    test('When error handler is called, it should set the status to 500 and use the generic message passed.', () => {
        let response = {
            json: jest.fn()
        };
        let errorMessage = 'Failed to do something';
        errorHandler.errorHandler(response, errorMessage);
        expect(response.statusCode).toEqual(500);
        expect(response.json).toHaveBeenCalledWith({ error: errorMessage});
    })

    test('When error handler is called with no generic message, it should set the status to 500 and use a generic message passed.', () => {
        let response = {
            json: jest.fn()
        };
        errorHandler.errorHandler(response);
        expect(response.statusCode).toEqual(500);
        expect(response.json).toHaveBeenCalledWith({ error: 'Failed to execute command. Please check logs.'});
    })
})
const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

class ClashUserServiceImpl {

    checkIfIdExists(id, username, serverName) {
        return new Promise(resolve => {
            clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
                if (!userDetails || !userDetails.id) {
                    clashSubscriptionDbImpl.createUpdateUserDetails(id, serverName, username, [])
                        .then((createdUser) => {
                            console.log(`Created a new User entry for ('${id}')`)
                            resolve(createdUser);
                        })
                } else {
                    resolve(userDetails);
                }
            })
        })
    }

    updateUserDetails(id, username) {
        return new Promise(resolve => {
            if (!id) {
                reject('Failed to pass id.')
            } else {
                let userUpdate = {
                    id: id,
                    playerName: username
                }
                clashSubscriptionDbImpl.updateUser(userUpdate).then(updatedUserDetails => {
                    resolve(updatedUserDetails);
                });
            }
        })
    }

}

module.exports = new ClashUserServiceImpl;

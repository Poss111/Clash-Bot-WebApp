const clashSubscriptionDbImpl = require('../dao/clash-subscription-db-impl');

class ClashUserServiceImpl {

    checkIfIdExists(id, username, serverName) {
        return new Promise(resolve => {
            clashSubscriptionDbImpl.retrieveUserDetails(id).then((userDetails) => {
                if (!userDetails || !userDetails.key) {
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
        return new Promise((resolve, reject) => {
            if (!id) {
                reject('Failed to pass id.')
            } else {
                let userUpdate = {
                    key: id,
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
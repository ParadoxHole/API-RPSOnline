const sql = require('./db.js');

const Friend = function(friend) {
    this.playerOneId = friend.playerOneId;
    this.playerTwoId = friend.playerTwoId;
    this.connectionStatus = friend.connectionStatus; // You might want to track the status of the friend request
};

Friend.sendFriendRequest = (senderId, receiverId, result) => {
    if (senderId === receiverId) {
        result('same_user', null);
        return;
    }

    sql.query(
        'SELECT * FROM connection WHERE (playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?)',
        [senderId, receiverId, receiverId, senderId],
        (err, existingConnections) => {
            if (err) {
                console.log('Error checking existing connections: ', err);
                result(err, null);
                return;
            }

            if (existingConnections.length > 0) {
                const existingConnection = existingConnections[0];

                if (existingConnection.connectionStatus === 'Friend') {
                    result('friend_exists', null);
                } else if (existingConnection.connectionStatus === 'Blocked') {
                    result('friend_blocked', null);
                } else if (existingConnection.connectionStatus === 'Pending' && existingConnection.playerOneId === parseInt(senderId) && existingConnection.playerTwoId === parseInt(receiverId)) {
                    result('friend_request_sent', null);
                } else {
                    sql.query(
                        'UPDATE connection SET connectionStatus = ? WHERE playerOneId = ? AND playerTwoId = ?',
                        ['Friend', receiverId, senderId],
                        (updateErr, updateRes) => {
                            if (updateErr) {
                                console.log('Error accepting friend request: ', updateErr);
                                result(updateErr, null);
                                return;
                            }
                            result(null, { message: 'Friend request accepted successfully.', acceptedFriend: receiverId });
                        }
                    );
                }
            } else {
                const friendRequest = new Friend({
                    playerOneId: senderId,
                    playerTwoId: receiverId,
                    connectionStatus: 'Pending'
                });

                sql.query('INSERT INTO connection SET ?', friendRequest, (insertErr, insertRes) => {
                    if (insertErr) {
                        console.log('Query error: ', insertErr);
                        result(insertErr, null);
                        return;
                    }

                    console.log('Sent friend request: ', friendRequest);
                    result(null, friendRequest);
                });
            }
        }
    );
};


Friend.acceptFriendRequest = (senderId, receiverId, result) => {
    // Check if the friend request exists
    sql.query(
      'SELECT * FROM connection WHERE playerOneId = ? AND playerTwoId = ? AND connectionStatus = "Pending"',
      [senderId, receiverId],
      (err, existingConnections) => {
        if (err) {
          console.log('Error checking existing connections: ', err);
          result(err, null);
          return;
        }
  
        if (existingConnections.length > 0) {
          // Accept the friend request by updating the connection status to "Friend"
          sql.query(
            'UPDATE connection SET connectionStatus = "Friend" WHERE playerOneId = ? AND playerTwoId = ?',
            [senderId, receiverId],
            (updateErr, updateRes) => {
              if (updateErr) {
                console.log('Error accepting friend request: ', updateErr);
                result(updateErr, null);
                return;
              }
              result(null, { message: 'Friend request accepted successfully.', acceptedFriend: senderId });
            }
          );
        } else {
          result({ message: 'Friend request does not exist or has already been accepted.', kind: 'not_found' }, null);
        }
      }
    );
  };

Friend.getFriendsList = (userId, result) => {
    sql.query(
        "SELECT player.*, connection.connectionStatus AS friendshipStatus FROM connection JOIN player ON (player.id = connection.playerOneId OR player.id = connection.playerTwoId) WHERE (connection.playerOneId = ? OR connection.playerTwoId = ?) AND connection.connectionStatus = 'Friend' AND player.id != ?",
        [userId, userId, userId],
        (err, friendsList) => {
            if (err) {
                console.log("Error retrieving friends list: ", err);
                result(err, null);
                return;
            }

            console.log("Retrieved friends list: ", friendsList);
            result(null, friendsList);
        }
    );
};

Friend.removeFriend = (userId, friendId, result) => {
    // Implement the logic to remove a friend from the friend list
    // Example code to remove a friend, you should adjust it based on your data structure
    sql.query("DELETE FROM connection WHERE (playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?)", [userId, friendId, friendId, userId], (err, res) => {
        if (err) {
            console.log("Error removing friend: ", err);
            result(err, null);
            return;
        }

        if (res.affectedRows === 0) {
            console.log("Friend not found");
            result("friend_not_found", null);
            return;
        }

        console.log("Friend removed successfully");
        result(null, res);
    });
};

Friend.checkFriendshipStatus = (userId1, userId2, result) => {
    sql.query(
        "SELECT connectionStatus FROM connection WHERE (playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?)",
        [userId1, userId2, userId2, userId1],
        (err, friendshipStatus) => {
            if (err) {
                console.log("Error checking friendship status: ", err);
                result(err, null);
                return;
            }

            if (friendshipStatus.length === 0) {
                // Friendship status is not found, they are not friends
                result(null, { friends: false });
            } else {
                // Friendship status found, return the status
                console.log("Friendship status: ", friendshipStatus[0].connectionStatus);
                result(null, { friends: true, status: friendshipStatus[0].connectionStatus });
            }
        }
    );
};

Friend.blockFriend = (senderId, receiverId, result) => {
    // Check if the friend request exists
    sql.query(
        'SELECT * FROM connection WHERE (playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?)',
        [senderId, receiverId, receiverId, senderId],
      (err, existingConnections) => {
        if (err) {
          console.log('Error checking existing connections: ', err);
          result(err, null);
          return;
        }
  
        if (existingConnections.length > 0) {
          // Block the friend by updating the connection status to "Blocked"
          sql.query(
            'UPDATE connection SET playerOneId = ?, playerTwoId = ?, connectionStatus = "Blocked" WHERE (playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?)',
            [senderId, receiverId,senderId, receiverId, receiverId, senderId],
            (updateErr, updateRes) => {
              if (updateErr) {
                console.log('Error blocking friend: ', updateErr);
                result(updateErr, null);
                return;
              }
              result(null, { message: 'Friend blocked successfully.', blockedFriend: receiverId });
            }
          );
        } else {
          result({ message: 'Friend cannot be blocked or does not exist.', kind: 'not_found' }, null);
        }
      }
    );
  };

  Friend.unblockFriend = (senderId, receiverId, result) => {
    // Check if the friend is already blocked
    sql.query(
        'SELECT * FROM connection WHERE playerOneId = ? AND playerTwoId = ? AND connectionStatus = "Blocked"',
        [senderId, receiverId],
        (err, existingConnections) => {
            if (err) {
                console.log('Error checking existing connections: ', err);
                result(err, null);
                return;
            }

            if (existingConnections.length > 0) {
                // Connection exists and is blocked
                // Delete the connection
                sql.query(
                    'DELETE FROM connection WHERE playerOneId = ? AND playerTwoId = ?',
                    [senderId, receiverId],
                    (deleteErr, deleteRes) => {
                        if (deleteErr) {
                            console.log('Error unblocking friend: ', deleteErr);
                            result(deleteErr, null);
                            return;
                        }
                        result(null, { message: 'Friend unblocked successfully.', unblockedFriend: receiverId });
                    }
                );
            } else {
                result({ message: 'Connection status is not "Blocked" or does not exist.', kind: 'not_blocked' }, null);
            }
        }
    );
};


module.exports = Friend;
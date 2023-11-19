const Friend = require('../models/friends.model.js');

const sendFriendRequest = (req, res) => {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;

    Friend.sendFriendRequest(senderId, receiverId, (err, friendRequest) => {
        if (err === 'same_user') {
            return res.status(400).send({ message: "You can't send a friend request to yourself." });
        } else if (err === 'friend_exists') {
            return res.status(400).send({ message: 'Friend request already accepted or exists.' });
        } else if (err === 'friend_blocked') {
            return res.status(400).send({ message: 'This user has blocked you.' });
        } else if (err === 'friend_request_sent') {
            return res.status(400).send({ message: 'Friend request has already been sent to this user.' });
        } else if (err) {
            return res.status(500).send({ message: "Error sending friend request." });
        }

        return res.status(200).send({ message: "Friend request sent successfully.", friendRequest });
    });
};

const acceptFriendRequest = (req, res) => {
  const senderId = req.body.senderId;
  const receiverId = req.body.receiverId;

  if (senderId === receiverId) {
    return res.status(400).send({ message: 'Cannot accept friend request from yourself.' });
  }

  Friend.acceptFriendRequest(senderId, receiverId, (err, result) => {
    if (err) {
      if (err.kind === 'not_found') {
        return res.status(400).send({ message: err.message });
      } else {
        return res.status(500).send({ message: 'Error accepting friend request.' });
      }
    }

    return res.status(200).send(result);
  });
};


const getFriendsList = (req, res) => {
    const userId = req.params.userId;

    Friend.getFriendsList(userId, (err, friendsList) => {
        if (err) {
            return res.status(500).send({ message: "Error retrieving friends list." });
        }

        return res.status(200).send(friendsList);
    });
};

const removeFriend = (req, res) => {
    const userId = req.body.userId;
    const friendId = req.body.friendId;

    Friend.removeFriend(userId, friendId, (err, data) => {
        if (err) {
            if (err === "friend_not_found") {
                return res.status(404).send({ message: "Friend not found." });
            }
            return res.status(500).send({ message: "Error removing friend." });
        }

        return res.status(200).send({ message: "Friend removed successfully." });
    });
};

// Check Friendship Status
const checkFriendshipStatus = (req, res) => {
    const userId1 = req.body.userId1;
    const userId2 = req.body.userId2;

    Friend.checkFriendshipStatus(userId1, userId2, (err, result) => {
        if (err) {
            return res.status(500).send({
                message: "Error checking friendship status."
            });
        }

        if (!result.friends) {
            return res.status(200).send({
                friends: false
            });
        }

        return res.status(200).send({
            friends: true,
            status: result.status
        });
    });
};

// Block Friend
const blockFriend = (req, res) => {
  const senderId = req.body.senderId;
  const receiverId = req.body.receiverId;

  if (senderId === receiverId) {
    return res.status(400).send({ message: 'Cannot block yourself as a friend.' });
  }

  Friend.blockFriend(senderId, receiverId, (err, result) => {
    if (err) {
      if (err.kind === 'not_found') {
        return res.status(400).send({ message: err.message });
      } else {
        return res.status(500).send({ message: 'Error blocking friend.' });
      }
    }

    return res.status(200).send(result);
  });
};

const unblockFriend = (req, res) => {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;

    Friend.unblockFriend(senderId, receiverId, (err, unblockedFriend) => {
        if (err) {
            if (err.kind === 'not_blocked') {
                return res.status(400).send({ message: 'Friend is not blocked or does not exist.' });
            }

            return res.status(500).send({ message: 'Error unblocking friend.' });
        }

        return res.status(200).send({ message: 'Friend unblocked successfully.', unblockedFriend });
    });
};

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    getFriendsList,
    removeFriend,
    checkFriendshipStatus,
    blockFriend,
    unblockFriend
};

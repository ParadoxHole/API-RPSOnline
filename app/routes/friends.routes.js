const authJwt = require("../middleware/auth.jwt");
const friendsController = require("../controllers/friends.controller.js"); // Make sure you have a controller for friend-related operations

module.exports = (app) => {
  var router = require("express").Router();

  // Send Friend Request
  router.post("/send-request", authJwt, friendsController.sendFriendRequest);
  // Accept Friend Request
  router.post("/accept-request", authJwt, friendsController.acceptFriendRequest);
  // Get Friends List
  router.get("/list/:userId", authJwt, friendsController.getFriendsList);
  // Remove Friend
  router.delete("/remove", authJwt, friendsController.removeFriend);
  // Check Friendship Status
  router.get("/check-status", authJwt, friendsController.checkFriendshipStatus);
  // Block Friend
  router.post("/block", authJwt, friendsController.blockFriend);
  // Unblock Friend
  router.post("/unblock", authJwt, friendsController.unblockFriend);

  app.use("/api/friends", router);
};

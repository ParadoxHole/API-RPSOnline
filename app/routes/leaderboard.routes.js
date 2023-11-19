const leaderboardController = require("../controllers/leaderboard.controller.js");
const express = require("express");
const router = express.Router();

module.exports = (app) => {
    //get the top 10 players
    router.get("/", leaderboardController.getTopPlayers);
    //get the top N players
    router.get("/:numberOfRows", leaderboardController.getTopNPlayers);
    //get the full leaderboard
    router.get("/full", leaderboardController.getFullLeaderboard);
    //get the rank of the player
    router.get("/rank/:playerId", leaderboardController.getRank);

    app.use("/api/leaderboard", router);
};

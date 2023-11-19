const matchController = require("../controllers/match.controller.js");
const express = require("express");
const router = express.Router();

module.exports = (app) => {
    // Get a player's match history by playerId
    router.get("/matchHistory/:playerId", matchController.getPlayerMatchHistory);

    // Get the match history between two specific players
    router.get("/matchHistory/:playerOneId/:playerTwoId", matchController.getMatchHistoryBetweenPlayers);

    // Check if matches are happening
    router.get("/checkMatch", matchController.checkMatches);

    //join a match
    router.post("/join/:playerId", matchController.joinMatch);
    //check if a match is full
    router.get("/checkPlayer/:playerId", matchController.checkPlayer);

    // make a move
    router.put("/move", matchController.makeMove);

    app.use("/api/match", router);
};

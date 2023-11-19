const Match = require('../models/match.model.js');

// Get a player's match history by playerId
const getPlayerMatchHistory = (req, res) => {
    const playerId = req.params.playerId;

    Match.getMatchHistoryByPlayerId(playerId, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Error retrieving match history for player with id " + playerId,
            });
        } else {
            res.send(data);
        }
    });
};

// Get the match history between two specific players
const getMatchHistoryBetweenPlayers = (req, res) => {
    const playerOneId = req.params.playerOneId;
    const playerTwoId = req.params.playerTwoId;

    Match.getMatchHistoryBetweenPlayers(playerOneId, playerTwoId, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Error retrieving match history between players with ids " + playerOneId + " and " + playerTwoId,
            });
        } else {
            res.send(data);
        }
    });
};

// Check if matches are happening
const checkMatches = (req, res) => {
    Match.checkMatches((err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Error checking if matches are happening.",
            });
        } else {
            res.send(data);
        }
    });
};

const checkPlayer = (req, res) => {
    const playerId = req.params.playerId;

    Match.checkPlayer(playerId, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Error checking if player is in a match.",
            });
        } else {
            res.status(200).send({data});
        }
    });
};

const joinMatch = (req, res) => {
    const playerId = req.params.playerId;

    Match.joinMatch(playerId, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Error joining match.",
            });
        } else {
            res.status(200).send({data});
        }
    });
};

const makeMove = (req, res) => {
    const playerId = req.body.playerId;
    const move = req.body.move;

    Match.makeMove(playerId, move, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Error making move.",
            });
        } else {
            res.status(200).send({data});
        }
    });
}

module.exports = {
    getPlayerMatchHistory,
    getMatchHistoryBetweenPlayers,
    checkMatches,
    checkPlayer,
    joinMatch,
    makeMove,
};
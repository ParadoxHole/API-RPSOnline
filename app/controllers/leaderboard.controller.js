const Leaderboard = require('../models/leaderboard.model.js');

const getTopPlayers = (req, res) => {
  Leaderboard.getTopPlayers((err, leaderboard) => {
    if (err) {
      return res.status(500).json({
        message: 'Error retrieving leaderboard data',
      });
    }
    res.json(leaderboard);
  });
};

const getTopNPlayers = (req, res) => {
  const numberOfRows = parseInt(req.params.numberOfRows) || 10;

  Leaderboard.getTopNPlayers(numberOfRows, (err, leaderboard) => {
    if (err) {
      return res.status(500).json({
        message: 'Error retrieving leaderboard data',
      });
    }
    res.json(leaderboard);
  });
};

const getFullLeaderboard = (req, res) => {
  // Check if the numberOfRows parameter exists in the request, if not, use a default value
  const numberOfRows = req.params.numberOfRows || 10;

  Leaderboard.getFullLeaderboard(numberOfRows, (err, leaderboard) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving the full leaderboard.',
      });
    } else {
      res.json(leaderboard);
    }
  });
};

const getRank = (req, res) => {
  const playerId = req.params.playerId;

  Leaderboard.getPlayerRank(playerId, (err, rank) => {
    if (err) {
      res.status(500).send({
        message: err.message || 'Error retrieving player rank.',
      });
    } else {
      res.json({ rank });
    }
  });
};

module.exports = {
    getTopPlayers,
    getTopNPlayers,
    getFullLeaderboard,
    getRank
};
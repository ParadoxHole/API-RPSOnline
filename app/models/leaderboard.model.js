const sql = require('./db.js');

const Leaderboard = function (leaderboard) {
    this.rank = leaderboard.rank;
    this.name = leaderboard.name;
    this.rating = leaderboard.rating;
    this.rankName = leaderboard.rankName;
  };

Leaderboard.getTopPlayers = (result) => {
  // SQL query to get the top players based on rating
  sql.query(`SELECT p.userName, p.rating, r.rankName
  FROM player AS p
  LEFT JOIN rankbrackets AS r ON p.rating BETWEEN r.minRating AND COALESCE(r.maxRating, p.rating)
  ORDER BY p.rating DESC
  LIMIT 10`, (err, res) => {
    if (err) {
      console.log('Error: ', err);
      result(err, null);
      return;
    }
    const leaderboard = res.map((row, index) => ({
      rank: index + 1,
      name: row.userName,
      rating: row.rating,
      rankName: row.rankName,
    }));
    result(null, leaderboard);
  });
};

Leaderboard.getTopNPlayers = (numberOfRows, result) => {
  // SQL query to get the top N players based on rating
  sql.query(`SELECT p.userName, p.rating, r.rankName
  FROM player AS p
  LEFT JOIN rankbrackets AS r ON p.rating BETWEEN r.minRating AND COALESCE(r.maxRating, p.rating)
  ORDER BY p.rating DESC
  LIMIT ?`, numberOfRows, (err, res) => {
    if (err) {
      console.log('Error: ', err);
      result(err, null);
      return;
    }
    const leaderboard = res.map((row, index) => ({
      rank: index + 1,
      name: row.userName,
      rating: row.rating,
      rankName: row.rankName,
    }));
    result(null, leaderboard);
  });
};


Leaderboard.getFullLeaderboard = (result) => {
    // SQL query to get the top players based on rating
    sql.query(`SELECT p.userName, p.rating, r.rankName
    FROM player AS p
    LEFT JOIN rankbrackets AS r ON p.rating BETWEEN r.minRating AND COALESCE(r.maxRating, p.rating)
    ORDER BY p.rating DESC`, (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }
      const leaderboard = res.map((row, index) => ({
        rank: index + 1,
        name: row.userName,
        rating: row.rating,
        rankName: row.rankName,
      }));
      result(null, leaderboard);
    });
};

Leaderboard.getPlayerRank = (playerId, result) => {
  // SQL query to get the rank of a specific player
  sql.query(
    'SELECT p.userName, p.rating, r.rankName, FIND_IN_SET( p.rating, (SELECT GROUP_CONCAT( rating ORDER BY rating DESC ) FROM player ) ) AS rank FROM player AS p LEFT JOIN rankbrackets AS r ON p.rating BETWEEN r.minRating AND COALESCE(r.maxRating, p.rating) WHERE p.id = ?',
    playerId,
    (err, res) => {
      if (err) {
        console.log('Error: ', err);
        result(err, null);
        return;
      }
      if (res.length > 0) {
        result(null, {
          rank: res[0].rank,
          name: res[0].userName,
          rating: res[0].rating,
          rankName: res[0].rankName,
        });
      } else {
        result({ message: 'Player not found.', kind: 'not_found' }, null);
      }
    }
  );
};

module.exports = Leaderboard;

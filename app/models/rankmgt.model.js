const sql = require('./db.js');

const Rank = function (rank) {
    this.rankName = rank.rankName;
    this.minRating = rank.minRating;
    this.maxRating = rank.maxRating;
    this.description = rank.description;
};

// Get all ranks
Rank.getAllRanks = (result) => {
    sql.query('SELECT * FROM rankbrackets ORDER BY minRating', (err, res) => {
        if (err) {
            console.log('Error: ', err);
            result(err, null);
            return;
        }
        result(null, res);
    });
};

// Get a specific rank by rankName
Rank.getRankById = (rankName, result) => {
    sql.query('SELECT * FROM rankbrackets WHERE rankName = ?', rankName, (err, res) => {
        if (err) {
            console.log('Error: ', err);
            result(err, null);
            return;
        }
        if (res.length) {
            result(null, res[0]);
        } else {
            result({ message: 'Rank not found.', kind: 'not_found' }, null);
        }
    });
};

// Create a new rank
Rank.createRank = (newRank, result) => {
    sql.query('INSERT INTO rankbrackets SET ?', newRank, (err, res) => {
        if (err) {
            console.log('Query error: ', err);
            result(err, null);
            return;
        }
        result(null, { rankId: res.insertId, ...newRank });
    });
};

// Update an existing rank by rankId
Rank.updateRank = (rankId, updatedRank, result) => {
    sql.query('UPDATE rankbrackets SET ? WHERE rankId = ?', [updatedRank, rankId], (err, res) => {
        if (err) {
            console.log('Query error: ', err);
            result(err, null);
            return;
        }
        if (res.affectedRows === 0) {
            result({ message: 'Rank not found.', kind: 'not_found' }, null);
        } else {
            result(null, { rankId, ...updatedRank });
        }
    });
};

// Delete a rank by rankId
Rank.deleteRank = (rankId, result) => {
    sql.query('DELETE FROM rankbrackets WHERE rankId = ?', rankId, (err, res) => {
        if (err) {
            console.log('Query error: ', err);
            result(err, null);
            return;
        }
        if (res.affectedRows === 0) {
            result({ message: 'Rank not found.', kind: 'not_found' }, null);
        } else {
            result(null, { message: 'Rank deleted successfully.' });
        }
    });
};

module.exports = Rank;

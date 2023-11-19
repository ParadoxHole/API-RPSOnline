const Rank = require('../models/rankmgt.model.js');

// Get all ranks
exports.getAllRanks = (req, res) => {
    Rank.getAllRanks((err, ranks) => {
        if (err) {
            res.status(500).send({
                message: err.message || 'Error retrieving ranks.',
            });
        } else {
            res.json(ranks);
        }
    });
};

// Get a specific rank by rankName
exports.getRankById = (req, res) => {
    const rankName = req.params.rankName;

    Rank.getRankById(rankName, (err, rank) => {
        if (err) {
            res.status(500).send({
                message: err.message || 'Error retrieving the rank.',
            });
        } else {
            res.json(rank);
        }
    });
};

// Create a new rank
exports.createRank = (req, res) => {
    if (!req.body) {
        res.status(400).send({
            message: 'Content can not be empty!',
        });
        return;
    }

    const newRank = new Rank({
        rankName: req.body.rankName,
        minRating: req.body.minRating,
        maxRating: req.body.maxRating,
        description: req.body.description,
    });

    Rank.createRank(newRank, (err, rank) => {
        if (err) {
            res.status(500).send({
                message: err.message || 'Error creating the rank.',
            });
        } else {
            res.json(rank);
        }
    });
};

// Update an existing rank by rankId
exports.updateRank = (req, res) => {
    const rankId = req.params.rankId;

    if (!req.body) {
        res.status(400).send({
            message: 'Content can not be empty!',
        });
        return;
    }

    const updatedRank = new Rank({
        rankName: req.body.rankName,
        minRating: req.body.minRating,
        maxRating: req.body.maxRating,
        description: req.body.description,
    });

    Rank.updateRank(rankId, updatedRank, (err, rank) => {
        if (err) {
            res.status(500).send({
                message: err.message || 'Error updating the rank.',
            });
        } else {
            res.json(rank);
        }
    });
};

// Delete a rank by rankId
exports.deleteRank = (req, res) => {
    const rankId = req.params.rankId;

    Rank.deleteRank(rankId, (err, result) => {
        if (err) {
            res.status(500).send({
                message: err.message || 'Error deleting the rank.',
            });
        } else {
            res.json({ message: 'Rank deleted successfully!' });
        }
    });
};

const express = require("express");
const router = express.Router();
const rankManagementController = require("../controllers/rankmgt.controller.js");

module.exports = (app) => {
    // Get all ranks
    router.get("/", rankManagementController.getAllRanks);

    // Get a specific rank by rankName
    router.get("/:rankName", rankManagementController.getRankById);

    // Create a new rank
    router.post("/", rankManagementController.createRank);

    // Update an existing rank by rankName
    router.put("/:rankName", rankManagementController.updateRank);

    // Delete a rank by rankName
    router.delete("/:rankName", rankManagementController.deleteRank);

    app.use("/api/rankmgt", router);
};

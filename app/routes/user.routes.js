const authJwt = require("../middleware/auth.jwt");
module.exports = (app) => {
    const user_controller = require("../controllers/user.controller.js");
    var router = require("express").Router();
    router.post("/signup", user_controller.createNewUser);
    router.get("/:us", user_controller.validUsername);
    router.post("/login", user_controller.login);
    router.get("/", authJwt, user_controller.getAllUsers);
    router.put("/:id", authJwt, user_controller.updateUserCtrl);
    router.delete("/:id", authJwt, user_controller.deleteUser);
    // New route to set user rating by value
    router.post("/rating/:id/:value", authJwt, user_controller.setRating);

    // New routes to add and subtract values from user rating
    router.post("/rating/add/:id/:value", authJwt, user_controller.addRating);
    router.post("/rating/sub/:id/:value", authJwt, user_controller.subtractRating);

    //get user by id
    router.get("/get/:id", authJwt, user_controller.getUserById);
    //get user by username
    //router.get("/get/username/:username", authJwt, user_controller.getUserByUsername);
    //get user totalGamePlayed
    //router.get("/get/totalGamePlayed/:id", authJwt, user_controller.getTotalGamePlayed);
    //get user totalGameWon
    //router.get("/get/totalGameWon/:id", authJwt, user_controller.getTotalGameWon);
    //get user totalGameLost
    //router.get("/get/totalGameLost/:id", authJwt, user_controller.getTotalGameLost);

    app.use("/api/auth", router);
};
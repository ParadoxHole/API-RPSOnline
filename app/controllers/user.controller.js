const User = require('../models/user.model.js');
const bcrypt = require("bcryptjs");


const validUsername = (req, res) => {
    User.checkUsername(req.params.us, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(200).send({ message: `Not found username ${req.params.us}.`, valid: true });
            } else {
                res.status(500).send({ message: "Error retrieving username " + req.params.us });
            }
        } else {
            res.send({record: data, valid: false});
        }
    });
};

const createNewUser = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({ message: "Content can not be empty!" });
    }
    // Create a User
    const salt = bcrypt.genSaltSync(10);
    const userObj = new User({
        fullname: req.body.fullname,
        email: req.body.email,
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, salt),
        img: req.body.img,
    });
    // Save User in the database
    User.create(userObj, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the User.",
            });
        } else {
            res.send(data);
        }
    });
}

const login = (req, res) => {
    if (!req.body) {
        res.status(400).send({ message: "Content can not be empty." });
    }
    const acc = new User({
        username: req.body.username,
        password: req.body.password
    });
    User.loginModel(acc, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(401).send({ message: "Not Found " + req.body.username });
            } else if (err.kind === "invalid_password") {
                res.status(401).send({ message: "Invalid Password" });
            } else {
                res.status(500).send({ message: "Query error." });
            }
        } else {
            res.send(data);
        }
    });
};

const getAllUsers = (req, res) => {
    User.getAllRecords((err, data) => {
        if (err) {
            res.status(500).send({ message: err.message || "Some error occurred while retrieving users." });
        } else {
            res.send(data);
        }
    });
};

const updateUserCtrl = (req, res) => {
    if (!req.body) {
        res.status(400).send({ message: "Content can not be empty." });
    }
    const data = {
        fullname: req.body.fullname,
        email: req.body.email,
        img: req.body.img,
    }

    User.updateUser(req.params.id, data, (err, result) => {
        if (err) {
            if (err.kind == "not_found") {
                res.status(404).send({ message: "Not found user: " + req.params.id });
            } else {
                res.status(500).send({ message: "Error updating user with id " + req.params.id });
            }
        } else {
            res.send(result);
        }
    });
};

const deleteUser = (req, res) => {
    User.deleteUser(req.params.id, (err, result) => {
        if (err) {
            if (err.kind == "not_found") {
                res.status(404).send({ message: "Not found user: " + req.params.id });
            } else {
                res.status(500).send({ message: "Could not delete user with id " + req.params.id });
            }
        } else {
            res.send({ message: "User deleted successfully!" });
        }
    });
};

const setRating = (req, res) => {
    const userId = req.params.id;
    const ratingValue = req.params.value;

    User.setRating(userId, ratingValue, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: 'Error setting user rating',
            });
        }
        res.json(result);
    });
};

const addRating = (req, res) => {
    const userId = req.params.id;
    const ratingValue = req.params.value;

    User.addRating(userId, ratingValue, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: 'Error adding rating to the user',
            });
        }
        res.json(result);
    });
};

const subtractRating = (req, res) => {
    const userId = req.params.id;
    const ratingValue = req.params.value;

    User.subtractRating(userId, ratingValue, (err, result) => {
        if (err) {
            return res.status(500).json({
                message: 'Error subtracting rating from the user',
            });
        }
        res.json(result);
    });
};

module.exports = { 
    validUsername, 
    createNewUser, 
    login, 
    getAllUsers, 
    updateUserCtrl, 
    deleteUser, 
    setRating,
    addRating,
    subtractRating,
};
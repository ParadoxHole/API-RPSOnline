const sql = require('./db.js');
const jwt = require("jsonwebtoken");
const scKey = require("../config/jwt.config.js");
const bcrypt = require("bcryptjs");
const expireTme = "2h";
const fs = require("fs");

const User = function(user) {
    this.fullname = user.fullname;
    this.email = user.email;
    this.username = user.username;
    this.password = user.password;
    this.img = user.img;
};
User.checkUsername = (username, result) => {
    sql.query("SELECT * FROM player WHERE username = '"+username+"'", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            console.log("found username: ", res[0]);
            result(null, true);
            return;
        }
        result({kind: "not_found"}, false);
    });
};

User.create = (newUser, result)=>{
    sql.query("INSERT INTO player SET ?", newUser , (err, res)=>{
        if(err){
            console.log("Querry error: ", err);
            result(err, null);
            return;
        }
        const token = jwt.sign({id: res.insertId}, scKey.secret, {expiresIn: expireTme});
        console.log("created user: ", {id: res.insertId, ...newUser, accessToken: token});
        result(null, {id: res.insertId, ...newUser, accessToken: token});
    });
};

User.loginModel = (account, result) => {
    console.log(account.username);
    sql.query("SELECT * FROM player WHERE username = ?", [account.username], (err, res) => {
        if (err) {
            console.log("Querry error: ", err);
            result(err, null);
            return;
        }
        if (res.length) {
            const validPassword = bcrypt.compareSync(account.password, res[0].password);
            if (validPassword) {
                // Update the lastLogin to today's date
                const today = new Date();
                console.log('Today: ', today);
                sql.query(
                    'UPDATE player SET lastLogin = ? WHERE id = ?',
                    [today, res[0].id],
                    (updateErr, updateRes) => {
                        if (updateErr) {
                            console.log('Error updating lastLogin: ', updateErr);
                            result(updateErr, null);
                        } else {
                            const token = jwt.sign({ id: res[0].id }, scKey.secret, { expiresIn: expireTme });
                            console.log("Login success. Token: ", token);
                            res[0].accessToken = token;
                            result(null, res[0]);
                        }
                    }
                );
            } else {
                console.log("Password invalid: ", res[0]);
                result({ kind: "invalid_password" }, null);
            }
            return;
        }
        result({ kind: "not_found" }, null);
    });
};


User.getAllRecords = (result) => {
    sql.query("SELECT * FROM player", (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
        }
        console.log("users: ", res);
        result(null, res);
    });
};

const removeOldImage = (id, result) => {
    sql.query("SELECT img FROM player WHERE id = ?", id, (err, res)=>{
        if(err){
            console.log("error: ", err);
            result(null, err);
            return;
        }
        if(res.length){
            let filePath = __basedir + "/assets/uploads/" + res[0].img;
            try {
                if(fs.existsSync(filePath)){
                    fs.unlinkSync(filePath, (err)=>{
                        if(err){
                            console.log("error: ", err);
                            return;
                        }else{
                            console.log("File: ", res[0].img, " removed.");
                            return;
                        }
                    });
                } else {
                    console.log("File: " + res[0].img + " not found.");
                    return;
                }
            } catch (error) {
                console.error(error);
                return;
            }
            result(null, res[0].img);
        } else {
            result({kind: "not_found"}, null);
        }
    });
};

User.updateUser = (id, data, result) => {
    removeOldImage(id);
    sql.query("UPDATE player SET fullname=?, email=?, img=? WHERE id = ?", [data.fullname, data.email, data.img, id], (err, res)=>{
        if(err){
            console.log("error: ", err);
            result(null, err);
            return;
        }
        if(res.affectedRows == 0){
            result({kind: "not_found"}, null);
            return;
        }
        console.log("updated user: ", {id: id, ...data});
        result(null, {id: id, ...data});
        return;
    });
}

User.deleteUser = (id, result) => {
    removeOldImage(id);
    sql.query("DELETE FROM player WHERE id = ?", id, (err, res)=>{
        if(err){
            console.log("error: ", err);
            result(null, err);
            return;
        }
        if(res.affectedRows == 0){
            result({kind: "not_found"}, null);
            return;
        }
        console.log("deleted user: ", id);
        result(null, res);
    });
};

User.setRating = (userId, ratingValue, result) => {
    // Implement the logic to set the user's rating to the provided value using SQL queries.

    // Example SQL query:
    sql.query('UPDATE player SET rating = ? WHERE id = ?', [ratingValue, userId], (err, res) => {
        if (err) {
            console.log('Error setting user rating: ', err);
            result(err, null);
            return;
        }
        result(null, { message: 'User rating set successfully.', userId });
    });
};

User.addRating = (userId, ratingValue, result) => {
    // Implement the logic to add the provided value to the user's rating using SQL queries.

    // Example SQL query:
    sql.query('UPDATE player SET rating = rating + ? WHERE id = ?', [ratingValue, userId], (err, res) => {
        if (err) {
            console.log('Error adding rating to the user: ', err);
            result(err, null);
            return;
        }
        result(null, { message: 'Rating added to the user successfully.', userId });
    });
};

User.subtractRating = (userId, ratingValue, result) => {
    // Implement the logic to subtract the provided value from the user's rating using SQL queries.

    // Example SQL query:
    sql.query('UPDATE player SET rating = rating - ? WHERE id = ?', [ratingValue, userId], (err, res) => {
        if (err) {
            console.log('Error subtracting rating from the user: ', err);
            result(err, null);
            return;
        }
        result(null, { message: 'Rating subtracted from the user successfully.', userId });
    });
};

module.exports = User;

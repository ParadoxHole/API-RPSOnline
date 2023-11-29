const sql = require('./db.js');
const matchController = require("../controllers/match.controller.js");



const Match = function (match) {
    this.playerOneId = match.playerOneId;
    this.playerTwoId = match.playerTwoId;
    this.POcurrentRank = null; // Will be retrieved from the database
    this.PTcurrentRank = null; // Will be retrieved from the database
    this.result = "ongoing";
    this.startTime = new Date(); // Start time is the current time
    this.endTime = null; // End time is initially set as null and will be updated when the match is finished
};

// Start a new match
Match.prototype.create = function (result) {
    // Check if either player is already in a match
    const newMatch = this;
    sql.query(
        'SELECT * FROM matchmakinghistory WHERE ((playerOneId = ? OR playerTwoId = ?) OR (playerOneId = ? OR playerTwoId = ?)) AND result = "ongoing"',
        [newMatch.playerOneId, newMatch.playerTwoId, newMatch.playerTwoId, newMatch.playerOneId],
        (err, ongoingMatches) => {
            if (err) {
                result(err, null);
                return;
            }

            if (ongoingMatches.length > 0) {
                result(new Error('One or both players are still in an ongoing match.'), null);
                return;
            }

            // Retrieve current ranks for playerOne and playerTwo from the database
            sql.query(
                'SELECT rating FROM player WHERE id = ?',
                [newMatch.playerOneId],
                (err, results1) => {
                    if (err) {
                        result(err, null);
                        return;
                    }
            
                    if (results1.length !== 1) {
                        result(new Error('Could not find rating for playerOne.'), null);
                        return;
                    }
            
                    // Retrieve the rating for playerTwo
                    sql.query(
                        'SELECT rating FROM player WHERE id = ?',
                        [newMatch.playerTwoId],
                        (err, results2) => {
                            if (err) {
                                result(err, null);
                                return;
                            }
            
                            if (results2.length !== 1) {
                                result(new Error('Could not find rating for playerTwo.'), null);
                                return;
                            }
            
                            newMatch.POcurrentRank = results1[0].rating;
                            newMatch.PTcurrentRank = results2[0].rating;
            
                            sql.query("INSERT INTO matchmakinghistory SET ?", newMatch, (err, res) => {
                                if (err) {
                                    result(err, null);
                                    return;
                                }
        
                                result(null, { id: res.insertId, ...newMatch });
                            });
                        }
                    );
                }
            );          
        }
    );
};


Match.prototype.finish = function (playerOneId, playerTwoId, result) {
    sql.query(
        'UPDATE matchmakinghistory SET result = ?, endTime = ? WHERE ((playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?)) AND result = "ongoing"',
        [result, new Date(), playerOneId, playerTwoId, playerTwoId, playerOneId],  
        (updateErr, updateRes) => {
            if (updateErr) {
                console.log('Error finishing match: ', updateErr);
            } else {
                if (result === 'P1Win') {
                    updateRating(playerOneId, playerTwoId);
                } else {
                    updateRating(playerTwoId, playerOneId);
                }
            }
        }
    );

    const updateRating = (winnerId, loserId) => {
        sql.query('UPDATE player SET rating = rating + 1 WHERE id = ?', [winnerId], (errWinner, resWinner) => {
            if (errWinner) {
                console.log('Error updating winner rating: ', errWinner);
            } else {
                sql.query('UPDATE player SET rating = rating - 1 WHERE id = ?', [loserId], (errLoser, resLoser) => {
                    if (errLoser) {
                        console.log('Error updating loser rating: ', errLoser);
                    }
                    return;
                });
            }
        });
    };
    return;
}

Match.getMatchHistoryByPlayerId = (playerId, result) => {
    sql.query(
        'SELECT * FROM matchmakinghistory WHERE playerOneId = ? OR playerTwoId = ?',
        [playerId, playerId],
        (err, res) => {
            if (err) {
                result(err, null);
                return;
            }

            result(null, res);
        }
    );
}

Match.getMatchHistoryBetweenPlayers = (playerOneId, playerTwoId, result) => {
    sql.query(
        'SELECT * FROM matchmakinghistory WHERE ((playerOneId = ? AND playerTwoId = ?) OR (playerOneId = ? AND playerTwoId = ?))',
        [playerOneId, playerTwoId, playerTwoId, playerOneId],
        (err, res) => {
            if (err) {
                result(err, null);
                return;
            }

            result(null, res);
        }
    );
}

Match.checkMatches = (result) => {
    sql.query(
        'SELECT * FROM matchmakinghistory WHERE result = "ongoing"',
        (err, res) => {
            if (err) {
                result(err, null);
                return;
            }

            result(null, res);
        }
    );
}

Match.joinMatch = (playerId, result) => {
    sql.query(
        'SELECT ID FROM activegame WHERE (playerOneId = ? OR PlayerTwoId = ?)',
        [playerId, playerId],
        (checkErr, checkRes) => {
            if (checkErr) {
                result(checkErr, null);
                return;
            }

            if (checkRes.length > 0) {
                // The playerId is already in an active match
                result("Player is already in an active match", null);
            } else {
    sql.query(
        'SELECT ID FROM activegame WHERE playerOneId IS NULL OR PlayerTwoId IS NULL LIMIT 1',
        (err, res) => {
            if (err) {
                result(err, null);
                return;
            }

            if (res.length > 0) {
                // An available slot was found, update the game (using PUT)
                const matchId = res[0].ID;
                const updateField = res[0].playerOneId === null ? 'playerOneId' : 'PlayerTwoId';
                const updateQuery = `UPDATE activegame SET ${updateField} = ? WHERE ID = ?`;
        
                sql.query(updateQuery, [playerId, matchId], (updateErr, updateRes) => {
                    if (updateErr) {
                        result(updateErr, null);
                        return;
                    }
                    sql.query("SELECT playerOneId, playerTwoId FROM activegame WHERE ID = ?", [matchId], (err, res) => {

                    const newMatch = new Match({
                        playerOneId: res[0].playerOneId === null ? playerId : res[0].playerOneId,
                        playerTwoId: res[0].playerTwoId === null ? playerId : res[0].playerTwoId,
                        PlayerOneChoice: null,
                        PlayerTwoChoice: null,
                        PlayerOneScore: 0,
                        PlayerTwoScore: 0,
                    });

                    newMatch.create((err, result) => {
                        if (err) {
                            console.error("Error creating match:", err);
                        } else {
                            console.log("Match created successfully:", result);
                        }
                    });                 

                    result(null, {matchId,"waiting":false});
                });
                });
            } else {
                // No available slot found, create a new game (using POST)
                const newGame = {
                    playerOneId: playerId,
                    PlayerTwoId: null,
                    PlayerOneChoice: null,
                    PlayerTwoChoice: null,
                    PlayerOneScore: 0,
                    PlayerTwoScore: 0,
                };
        
                sql.query('INSERT INTO activegame SET ?', newGame, (insertErr, insertRes) => {
                    if (insertErr) {
                        result(insertErr, null);
                        return;
                    }

                    result(null, {"matchId":insertRes.insertId, "waiting":true});
                });
            }
        }
    );
}});
};

Match.leaveMatch = (playerId, result) => {
    sql.query(
        'SELECT ID FROM activegame WHERE (playerOneId = ? OR PlayerTwoId = ?)',
        [playerId, playerId],
        (checkErr, checkRes) => {
            if (checkErr) {
                result(checkErr, null);
            return;}
            if (checkRes.length === 0) {
                // The playerId is not in an active match
                result("Player is not in an active match", null);
            } else {
                // The playerId is in an active match, remove them from the match
                const matchId = checkRes[0].ID;
                const updateQuery = `DELETE FROM activegame WHERE ID = ?`;
        
                sql.query(updateQuery, [matchId], (updateErr, updateRes) => {
                    if (updateErr) {
                        result(updateErr, null);
                        return;
                    }
                    sql.query("DELETE FROM matchmakinghistory WHERE (playerOneId = ? OR playerTwoId = ?) AND result='ongoing'", [playerId,playerId], (err, res) => {
                        if (err) {
                            result(err, null);
                            return;
                        }

                        result(null, updateRes);
                    });
                });
            }
        }
    );
};

Match.checkPlayer = (playerId, result) => {
    sql.query(
        "SELECT * FROM activegame WHERE (playerOneId = ? OR playerTwoId = ?) AND (playerOneId IS NOT NULL AND playerTwoId IS NOT NULL)",
        [playerId, playerId],
        (err, res) => {
            if (err) {
                result(err, null);
                return;
            }
            if (res.length > 0) {
                // Include match data and set "waiting" to false
                result(null, { matchData: res[0], waiting: false });
            } else {
                // No match found, set "waiting" to true
                result(null, { waiting: true });
            }
        }
    );
};

Match.makeMove = (playerId, move, result) => {
    sql.query(
        "SELECT * FROM activegame WHERE (playerOneId = ? OR playerTwoId = ?)",
        [playerId, playerId],
        (err, res) => {
            if (err) {
                return result(err, null);
            }

            if (res.length === 0) {
                return result(new Error('Player is not in an active match.'), null);
            }

            const match = res[0];

            if (!match.ID) {
                return result(new Error('Match ID is null.'), null);
            }

            // Check if the match is full
            if (match.playerOneId === null || match.playerTwoId === null) {
                return result(new Error('Match is not full.'), null);
            }

            // Check if the player has already made a move
            if (
                (match.playerOneId === playerId && match.PlayerOneChoice !== null) ||
                (match.playerTwoId === playerId && match.PlayerTwoChoice !== null)
            ) {
                // Player has already made a move
                // No need to update the choice, just check for game completion
                checkGameCompletion(match, result, match.ID,playerId);
            } else {
                // Player hasn't made a move yet
                const updateField = match.playerOneId == playerId ? 'PlayerOneChoice' : 'PlayerTwoChoice';

                const updateQuery = `UPDATE activegame SET ${updateField} = ? WHERE (playerOneId = ? OR playerTwoId = ?) AND ${updateField} IS NULL`;

                sql.query(updateQuery, [move, playerId, playerId], (updateErr, updateRes) => {
                    if (updateErr) {
                        return result(updateErr, null);
                    }

                    // Check for game completion after updating the choice
                    checkGameCompletion(match, result, match.ID,playerId);
                });
            }
        }
    );
};



// Define the gameLogic function
function gameLogic(P1Choice, P2Choice) {
    if (P1Choice === P2Choice) {
        return "Draw";
    }
    if (P1Choice == 'Rock') {
        return P2Choice == 'Paper' ? "P2Win" : "P1Win";
    } else if (P1Choice == 'Paper') {
        return P2Choice == 'Rock' ? "P1Win" : "P2Win";
    } else if (P1Choice == 'Scissors') {
        return P2Choice == 'Rock' ? "P2Win" : "P1Win";
    }
}

// Update the checkGameCompletion function
function checkGameCompletion(match, result, matchId,playerId) {
    const playerOneChoice = match.PlayerOneChoice;
    const playerTwoChoice = match.PlayerTwoChoice;
    const playerOneId = match.playerOneId;
    const playerTwoId = match.playerTwoId;

    // Check if both players have made a move
    if (playerOneChoice !== null && playerTwoChoice !== null) {
        let PlayerOneScore = match.PlayerOneScore;
        let PlayerTwoScore = match.PlayerTwoScore;

        // Use the gameLogic function to determine the winner
        const gameResult = gameLogic(playerOneChoice, playerTwoChoice);

        // Update scores based on the game result
        if (gameResult === "P1Win") {
            PlayerOneScore++;
        } else if (gameResult === "P2Win") {
            PlayerTwoScore++;
        }

        // Check if the game is completed
        if (PlayerOneScore >= 3 || PlayerTwoScore >= 3) {
            // Call the finish function
            const resultType = PlayerOneScore >= 3 ? "P1Win" : "P2Win";

            // if one player has checked
            sql.query("SELECT * FROM activegame WHERE ID = ?", [matchId], (err, res) => {
                if (err) {
                    return result(err, null);
                }
                if (res[0].check == 0){
                    sql.query("UPDATE activegame SET `check` = ? WHERE ID = ?", [playerId, matchId], (err, res) => {
                        return result(null, { playerOneId, playerTwoId, resultType });
                    });
                } else if (res[0].check == playerId){
                    return result(null, { playerOneId, playerTwoId, resultType });
                } else {
                    Match.prototype.finish(playerOneId, playerTwoId, resultType);

                    // Delete the match from the active game table
                    sql.query("DELETE FROM activegame WHERE ID = ?", [matchId], (deleteErr, deleteRes) => {
                        if (deleteErr) {
                            return result(deleteErr, null);
                        }
                        return result(null, { playerOneId, playerTwoId, resultType });
                    });
                }
            });
        } else {
            sql.query("SELECT * FROM activegame WHERE ID = ?", [matchId], (err, res) => {
                if (err) {
                    return result(err, null);
                }
                if (res[0].check == 0){
                    sql.query("UPDATE activegame SET `check` = ? WHERE ID = ?", [playerId, matchId], (errUpdate, resUpdate) => {
                        const info = { ...res[0], gameResult };
                        result(null, info);
                    });
                } else if (res[0].check == playerId){
                    const info = { ...res[0], gameResult };
                    result(null, info);
                } else {
                    sql.query("UPDATE activegame SET PlayerOneChoice = null, PlayerTwoChoice = null, PlayerOneScore = ?, PlayerTwoScore = ?, `check` = 0 WHERE ID = ?", [PlayerOneScore, PlayerTwoScore,matchId], (err, res) => {});
                    const info = { ...res[0], gameResult };
                    result(null, info);
                }
            });
        }
    } else {
        // Players have not made a move yet
        return result(null, 'Both players have not made a move yet.');
    }
}

module.exports = Match;
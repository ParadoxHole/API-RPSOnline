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
        console.log("winnerId: ", winnerId, "loserId: ", loserId);
        sql.query('UPDATE player SET rating = rating + 1 WHERE id = ?', [winnerId], (errWinner, resWinner) => {
            if (errWinner) {
                console.log('Error updating winner rating: ', errWinner);
            } else {
                console.log("winner rating updated");
                sql.query('UPDATE player SET rating = rating - 1 WHERE id = ?', [loserId], (errLoser, resLoser) => {
                    if (errLoser) {
                        console.log('Error updating loser rating: ', errLoser);
                    }
                    console.log("loser rating updated");
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

Match.checkPlayer = (playerId, result) => {
    sql.query("SELECT * FROM activegame WHERE (playerOneId = ? OR playerTwoId = ?) AND (playerOneId IS NOT NULL AND playerTwoId IS NOT NULL)", 
    [playerId, playerId], (err, res) => {
        if (err) {
            result(err, null);
            return;
        }

        if (res.length === 0) {
            result(null, false);
        } else {
            result(null, true);
        }
    });
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
            const updateField = match.playerOneId == playerId ? 'PlayerOneChoice' : 'PlayerTwoChoice';
            const updateQuery = `UPDATE activegame SET ${updateField} = ? WHERE (playerOneId = ? OR playerTwoId = ?)`;

 
            sql.query(updateQuery, [move, playerId, playerId], (updateErr, updateRes) => {
                if (updateErr) {
                    return result(updateErr, null);
                }

                let output = "waiting";
                const matchId = match.ID;

                sql.query('SELECT * FROM activegame WHERE ID = ?', [matchId], (err, res) => {
                    if (err) {
                        return result(err, null);
                    }

                    if (res.length === 0) {
                        return result(new Error('Match not found.'), null);
                    }

                    const updatedMatch = res[0];
                    const playerOneChoice = updatedMatch.PlayerOneChoice;
                    const playerTwoChoice = updatedMatch.PlayerTwoChoice;
                    const playerOneId = updatedMatch.playerOneId;
                    const playerTwoId = updatedMatch.playerTwoId;

                    if (playerOneChoice === null || playerTwoChoice === null) {
                        return result(null, 'Both players have not made a move yet.');
                    }

                    let PlayerOneScore = updatedMatch.PlayerOneScore;
                    let PlayerTwoScore = updatedMatch.PlayerTwoScore;

                    if (playerOneChoice === playerTwoChoice) {
                        output = "tie";
                    }
                    if (playerOneChoice === 'Rock') {
                        if (playerTwoChoice === 'Paper') {
                            PlayerTwoScore++;
                            output = "P2Win";
                        } else if (playerTwoChoice === 'Scissors') {
                            PlayerOneScore++;
                            output = "P1Win";
                        }
                    } else if (playerOneChoice === 'Paper') {
                        if (playerTwoChoice === 'Rock') {
                            PlayerOneScore++;
                            output = "P1Win";
                        } else if (playerTwoChoice === 'Scissors') {
                            PlayerTwoScore++;
                            output = "P2Win";
                        }
                    } else if (playerOneChoice === 'Scissors') {
                        if (playerTwoChoice === 'Rock') {
                            PlayerTwoScore++;
                            output = "P2Win";
                        } else if (playerTwoChoice === 'Paper') {
                            PlayerOneScore++;
                            output = "P1Win";
                        }
                    }

                    function sleep(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                      }
                      
                    console.log('Hello');
                    sleep(2000).then(() => { 
                    sql.query("UPDATE activegame SET PlayerOneScore = ?, PlayerTwoScore = ? WHERE ID = ?", 
                        [PlayerOneScore, PlayerTwoScore, matchId], 
                        (updateErr, updateRes) => {
                            if (updateErr) {
                                return result(updateErr, null);
                            }

                            console.log("playerOneId: ", playerOneId, "playerTwoId: ", playerTwoId);

                            if (PlayerOneScore >= 3) {
                                Match.prototype.finish(playerOneId, playerTwoId, "P1Win");
                                // remove the match from the active game table and add it to the match history table
                                sql.query("DELETE FROM activegame WHERE ID = ?", [matchId], (deleteErr, deleteRes) => {
                                    if (deleteErr) {
                                        return result(deleteErr, null);
                                    }
                                    return result(null, playerOneId, playerTwoId, "P1Win");
                                });
                            } else if (PlayerTwoScore >= 3) {
                                Match.prototype.finish(playerOneId, playerTwoId, "P2Win");
                                sql.query("DELETE FROM activegame WHERE ID = ?", [matchId], (deleteErr, deleteRes) => {
                                    if (deleteErr) {
                                        return result(deleteErr, null);
                                    }
                                    return result(null, playerOneId, playerTwoId, "P2Win");
                                });
                            } else {
                                sql.query("UPDATE activegame SET playerOneChoice = null, playerTwoChoice = null WHERE ID = ?", [matchId], (err, res) => {
                                    if (err) {
                                        return result(err, null);
                                    }
                                    sql.query("SELECT * FROM activegame WHERE ID = ?", [match.ID], (err, res) => {
                                        info = {...res[0], output};
                                        result(null,info);
                                    });
                                });
                            }
                        }
                    );
                }); 
            });
        }); 
        }
    );
};



module.exports = Match;
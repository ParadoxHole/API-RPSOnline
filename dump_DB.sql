DROP TABLE IF EXISTS `connection`;
DROP TABLE IF EXISTS `MatchMakingHistory`;
DROP TABLE IF EXISTS `player`;
DROP TABLE IF EXISTS `RankBrackets`;

CREATE TABLE player (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,          -- Numeric ID (auto-incrementing)
    fullname VARCHAR(255) NOT NULL,             -- Alphabetic Name
    email VARCHAR(255) NOT NULL,            -- Alphanumeric Email
    userName VARCHAR(255) NOT NULL,         -- Alphanumeric Username
    password VARCHAR(255) NOT NULL,         -- Alphanumeric Password (should be hashed in practice)
    img VARCHAR(255) DEFAULT NULL,              -- Alphanumeric Image URL
    rating NUMERIC DEFAULT 1000,                -- Numeric Rating
    lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of last login
);

CREATE TABLE MatchMakingHistory (
    matchId INT(11) PRIMARY KEY AUTO_INCREMENT,
    playerOneId INT(11) NOT NULL,
    playerTwoId INT(11) NOT NULL,
    POcurrentRank NUMERIC NOT NULL,
    PTcurrentRank NUMERIC NOT NULL,
    result VARCHAR(20) CHECK (result IN ('P1Win', 'P2Win', 'ongoing')),
    startTime TIMESTAMP NULL DEFAULT NULL,
    endTime TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (playerOneId) REFERENCES player(id),
    FOREIGN KEY (playerTwoId) REFERENCES player(id)
);

CREATE TABLE connection (
    playerOneId INT(11),
    playerTwoId INT(11),
    connectionStatus VARCHAR(20) CHECK (connectionStatus IN ('Friend', 'Pending', 'Blocked')),
    PRIMARY KEY (playerOneId, playerTwoId),
    FOREIGN KEY (playerOneId) REFERENCES player(id),
    FOREIGN KEY (playerTwoId) REFERENCES player(id)
);

CREATE TABLE RankBrackets (
    rankName VARCHAR(255) NOT NULL PRIMARY KEY,
    minRating NUMERIC NOT NULL,
    maxRating NUMERIC,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO RankBrackets (rankName, minRating, maxRating, description) VALUES
  ('Rock Rookie', 0, 499, 'You''re just starting out, learning the ropes of rock-paper-scissors.'),
  ('Paper Paddler', 500, 999, 'You''ve got a bit more experience, but you''re still folding under pressure.'),
  ('Scissors Slinger', 1000, 1499, 'You''re becoming quite proficient, cutting through the competition with your strategies.'),
  ('Stone Strategist', 1500, 1999, 'Your skills are solid as a rock, and your opponents are starting to feel the weight of your decisions.'),
  ('Elemental Expert', 2000, 2499, 'You''ve mastered the art of rock, paper, scissors, and your opponents are feeling the burn.'),
  ('Grand Gambit Guru', 2500, NULL, 'You''re a true grandmaster of the game, making calculated moves that leave your opponents stumped.');

CREATE TABLE ActiveGame (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    playerOneId INT(11),
    playerTwoId INT(11),    
    PlayerOneChoice VARCHAR(10) CHECK (PlayerOneChoice IN('Rock', 'Paper', 'Scissors')),
    PlayerTwoChoice VARCHAR(10) CHECK (PlayerTwoChoice IN('Rock', 'Paper', 'Scissors')),
    PlayerOneScore iNT(1),
    PlayerTwoScore INT(1),
    FOREIGN KEY (playerOneId) REFERENCES player(id),
    FOREIGN KEY (playerTwoId) REFERENCES player(id)
);
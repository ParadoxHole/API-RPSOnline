const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
global.__basedir = __dirname;
var corsOptions = {origin: "*"};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res)=>{
    res.json({ message: "Welcome to the Manage Account API."});
});

require("./app/routes/file.routes.js")(app);
require("./app/routes/user.routes.js")(app);
require("./app/routes/friends.routes.js")(app);
require("./app/routes/leaderboard.routes.js")(app);
require("./app/routes/rankmgt.route.js")(app);
require("./app/routes/match.routes.js")(app);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
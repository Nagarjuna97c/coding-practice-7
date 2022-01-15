const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Error Message:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/players/", async (request, response) => {
  const playerList = `
    SELECT
        player_id as playerId,player_name as playerName
    FROM
        player_details;
    `;
  const list = await db.all(playerList);
  response.send(list);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerList = `
    SELECT
        player_id as playerId,player_name as playerName
    FROM
        player_details
    WHERE
        player_id=${playerId};
    `;
  const list = await db.get(playerList);
  response.send(list);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatedPlayerDetails = `
    UPDATE
        player_details
    SET
        player_name='${playerName}'
    WHERE
        player_id=${playerId};
    `;
  const details = await db.run(updatedPlayerDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `
    SELECT
        match_id as matchId,match,year
    FROM
        match_details
    WHERE
        match_id=${matchId};
    `;
  const match = await db.get(matchDetails);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchDetails = `
    SELECT
        match_details.match_id as matchId,match_details.match as match,match_details.year as year
    FROM
        match_details JOIN player_match_score 
        ON match_details.match_id=player_match_score.match_id
    WHERE
        player_match_score.player_id=${playerId};
    `;
  const match = await db.all(matchDetails);
  response.send(match);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerDetails = `
    SELECT
        player_details.player_id as playerId,
        player_details.player_name as playerName
    FROM
        player_details JOIN player_match_score 
        ON player_details.player_id=player_match_score.player_id
    WHERE
        player_match_score.match_id=${matchId};
    `;
  const players = await db.all(playerDetails);
  response.send(players);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `
    SELECT
        player_details.player_id as playerId,
        player_details.player_name as playerName,
        sum(player_match_score.score) as totalScore,
        sum(player_match_score.fours) as totalFours,
        sum(player_match_score.sixes) as totalSixes
    FROM
        player_details JOIN player_match_score 
        ON player_details.player_id=player_match_score.player_id
    WHERE
        player_match_score.player_id=${playerId};
    `;
  const playerScore = await db.get(playerDetails);
  response.send(playerScore);
});

module.exports = app;

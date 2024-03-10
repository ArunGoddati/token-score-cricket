const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error:${e.message}')
    process.exit(1)
  }
}
initializeDbAndServer()

const convertplayerDbObjectTOResponseObject = playerDbObject => {
  return {
    playerId: playerDbObject.player_id,
    playerName: playerDbObject.player_name,
  }
}

const convertMatchDbObjectTOResponseObject = matchDbObject => {
  return {
    matchId: matchDbObject.match_id,
    match: matchDbObject.match,
    year: matchDbObject.year,
  }
}

// Api -- 1

app.get(`/players/`, async (request, response) => {
  const getPlayersQuery = `
  SELECT
  *
  FROM
  player_details
  `
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertplayerDbObjectTOResponseObject(eachPlayer),
    ),
  )
})

// Api -- 2

app.get(`/players/:playerId/`, async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  SELECT
  *
  FROM
  player_details
  WHERE 
  player_id = ${playerId};
  `
  const playerArray = await db.get(getPlayerQuery)
  response.send(convertplayerDbObjectTOResponseObject(playerArray))
})

// Api -- 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
  UPDATE 
  player_details
  SET
  player_name = '${playerName}'
  WHERE 
  player_id = ${playerId};
  `
  const updatePlayerArray = await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// Api -- 4

app.get(`/matches/:matchId/`, async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
  SELECT
  *
  FROM
  match_details
  WHERE 
  match_id = ${matchId};
  `
  const matchArray = await db.get(getMatchQuery)
  response.send(convertMatchDbObjectTOResponseObject(matchArray))
})

// Api -- 5

app.get(`/players/:playerId/matches`, async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchQuery = `
  SELECT 
  *
  FROM
  player_match_score
  NATURAL JOIN match_details
  WHERE player_id = ${playerId};
  `
  const getplayerMatchArray = await db.all(getPlayerMatchQuery)
  response.send(
    getplayerMatchArray.map(eachMatch =>
      convertMatchDbObjectTOResponseObject(eachMatch),
    ),
  )
})

// Api -- 6

app.get(`/matches/:matchId/players`, async (request, response) => {
  const {matchId} = request.params
  const getMatchIdPlayers = `
  SELECT 
  player_details.player_id AS playerId,
  player_details.player_name AS playerName
  FROM
  player_match_score NATURAL JOIN player_details
  WHERE match_id = ${matchId};
  `
  const matchIdPlayer = await db.get(getMatchIdPlayers)
  response.send(matchIdPlayer)
})

// Api -- 7

app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const {playerId} = request.params
  const getPlayerScore = `
  SELECT
  player_details.player_id AS player_id,
  player_details.player_name AS player_name,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes FROM 
  player_details INNER JOIN player_match_score ON 
  player_details.player_id = player_match_score.player_id
  WHERE player_details.player_id = ${playerId}
  `
  const getPlayerScoreArray = await db.get(getPlayerScore)
  response.send(getPlayerScoreArray)
})

module.exports = app

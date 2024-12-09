let playersData = [];
let currentPlayer = {}; // Store the current player object
let playerID = 0
let Name = ""
let teamName = ""
let playerStatsChart = null;
async function playerSearch() {
 
  console.log("searchPlayer called");
  const searchQuery = document.getElementById('search-input').value.trim();
  const [firstName, lastName] = searchQuery.split(' ');
  Name = firstName + " "+ lastName;
  console.log(firstName)
  if (!firstName || !lastName) {
    alert('Please enter both the first and last name.');
    return;
  }

  // Fetch players based on search input (search by last name)
  const url =`https://api-nba-v1.p.rapidapi.com/players?name=${lastName}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': 'f5947c3ed2mshbe927e427ea9644p1115a4jsnf07b6e8e02c9',
      'x-rapidapi-host': 'api-nba-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    const players = result.response;

    playersData = players;  // Save the players data globally

    // Filter players by matching first name and last name
    const matchedPlayer = players.find(player => player.firstname.toLowerCase() === firstName.toLowerCase() && player.lastname.toLowerCase() === lastName.toLowerCase());

    if (!matchedPlayer) {
      alert("Player not found with that full name.");
    } else {
      // Populate the table with the matched player
      playerID = matchedPlayer.id;
      console.log(playerID)
      console.log(matchedPlayer)
      getPlayerStats(playerID);
      displayChart(playerID);
      //populatePlayerStats([matchedPlayer]);
      

      
    }

  } catch (error) {
    console.error('Error searching for players:', error);
  }
}


function populatePlayerStats(players) {
  const playerStatsTable = document.getElementById('player-stats-table').getElementsByTagName('tbody')[0];
  playerStatsTable.innerHTML = '';  // Clear existing rows

  players.forEach(player => {
    const row = playerStatsTable.insertRow();
    row.innerHTML = `
      <td>${player.firstname} ${player.lastname}</td>
      <td>${player.team.name}</td>
      <td><button onclick="showPlayerDetails('${player.id}')">View Details</button></td>
      <td id="points-${player.id}">-</td>
      <td id="assists-${player.id}">-</td>
      <td id="rebounds-${player.id}">-</td>
    `;
  });
}

// Function to show player details and last 5 game stats
async function showPlayerDetails(playerId) {
  const player = playersData.find(p => p.id === playerId);
  currentPlayer = player;

  // Fetch the last 5 games stats for the selected player
  await getPlayerStats(playerId);
}


// Fetch player stats for the selected player and calculate averages for the last 5 games
async function getPlayerStats(playerId) {
  const url = `https://api-nba-v1.p.rapidapi.com/players/statistics?id=${playerId}&season=2024`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': 'f5947c3ed2mshbe927e427ea9644p1115a4jsnf07b6e8e02c9',
      'x-rapidapi-host': 'api-nba-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    const playerStats = result.response;

    // Calculate averages for the last 5 games
    const last5Games = playerStats.slice(-5);

    let totalPoints = 0;
    let totalAssists = 0;
    let totalRebounds = 0;

    last5Games.forEach(game => {
      totalPoints += game.points;
      totalAssists += game.assists;
      totalRebounds += game.totReb;
    });

    const avgPoints = totalPoints / last5Games.length;
    const avgAssists = totalAssists / last5Games.length;
    const avgRebounds = totalRebounds / last5Games.length;

    console.log('Averages for the last 5 games:');
    console.log(`Points: ${avgPoints.toFixed(2)}`);
    console.log(`Assists: ${avgAssists.toFixed(2)}`);
    console.log(`Rebounds: ${avgRebounds.toFixed(2)}`);

    const lastGame = playerStats[0];
    console.log(lastGame);
    teamName= lastGame.team.name;
    console.log(teamName);

    // Update the table with the averages for the player
    updateTableWithAverages(Name, avgPoints, avgAssists, avgRebounds, teamName);

  } catch (error) {
    console.error('Error fetching player stats:', error);
  }
}

// Function to update the table with the averages
function updateTableWithAverages(playerName, avgPoints, avgAssists, avgRebounds, teamName) {
  console.log("here")
  const tableBody = document.querySelector("#player-stats-table tbody");
  tableBody.innerHTML = "";
  const row = document.createElement("tr");

  // Create and append cells for each player property
  const playerCell = document.createElement("td");
  console.log(playerName)
  playerCell.textContent = playerName;
  row.appendChild(playerCell);

  const teamCell = document.createElement("td");
  teamCell.textContent = teamName;
  row.appendChild(teamCell);

  const pointsCell = document.createElement("td");
  pointsCell.textContent = avgPoints;
  row.appendChild(pointsCell);
  console.log("added points")

  const assistsCell = document.createElement("td");
  assistsCell.textContent = avgAssists;
  row.appendChild(assistsCell);

  const reboundsCell = document.createElement("td");
  reboundsCell.textContent = avgRebounds;
  row.appendChild(reboundsCell);

  // Append the row to the table body
  tableBody.appendChild(row);

}

async function LastFivePoints(playerId) {
  const url = `https://api-nba-v1.p.rapidapi.com/players/statistics?id=${playerId}&season=2024`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': 'f5947c3ed2mshbe927e427ea9644p1115a4jsnf07b6e8e02c9',
      'x-rapidapi-host': 'api-nba-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    const playerStats = result.response;

    // Calculate averages for the last 5 games
    const last5Games = playerStats.slice(-5);
    let lastFiveArray = last5Games.map(game => game.points);
    return lastFiveArray;


}
catch (error) {
  console.error('Error fetching player stats:', error);
  return [];
}
}


async function displayChart(playerId) {
  // Get the last 5 points scored by the player
  // if (gamePointsChart) {
  //   gamePointsChart.destroy();
  // }
  if (playerStatsChart) {
    playerStatsChart.destroy();
  }
  const lastFivePoints = await LastFivePoints(playerId);

  // Check if we received data
  if (lastFivePoints.length === 0) {
    alert('No data available for the player.');
    return;
  }

  // Create a chart with the last 5 points
  const ctx = document.getElementById('gamePointsChart').getContext('2d');
  console.log(lastFivePoints);
  playerStatsChart = new Chart(ctx, {
    type: 'line', // Choose a chart type (line, bar, etc.)
    data: {
      labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'], // Label for the games
      datasets: [{
        label: 'Points Scored',
        data: lastFivePoints, // Data from LastFivePoints function
        borderColor: 'rgb(75, 192, 192)', // Line color
        tension: 0.1,
        fill: false // Do not fill the area under the line
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Games'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Points'
          },
          beginAtZero: true
        }
      }
    }
  });
}
// function clearChart() {
  
//   // Optionally, hide the canvas if you want
//   document.getElementById('gamePointsChart').style.display = 'none'; // Hide canvas
// }



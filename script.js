let playersData = [];
let currentPlayer = {}; // Store the current player object


async function getPlayerStats() {
  const url = 'https://api-nba-v1.p.rapidapi.com/players/statistics?id=514&season=2024';
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

      const last5Games = playerStats.slice(-5); // Fixed this part by removing extra 'response'

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

  } catch (error) {
      console.error(error);
  }
}

// Call the function to get the stats
getPlayerStats();



  

// Function to populate player stats in the table
function populatePlayerStats(players) {
  const playerStatsTable = document.getElementById('player-stats-table').getElementsByTagName('tbody')[0];
  playerStatsTable.innerHTML = '';  // Clear existing rows

  players.forEach(player => {
    const row = playerStatsTable.insertRow();
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.team}</td>
      <td>${player.points}</td>
      <td>${player.assists}</td>
      <td>${player.rebounds}</td>
      <td><button onclick="showPlayerDetails('${player.id}')">View Details</button></td>
    `;
  });
}

// Function to search for a player by name
function searchPlayer() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const filteredPlayers = playersData.filter(player => player.name.toLowerCase().includes(searchQuery));
  populatePlayerStats(filteredPlayers);
}

// Function to show player details and last 5 game stats
function showPlayerDetails(playerId) {
  const player = playersData.find(p => p.id === playerId);
  currentPlayer = player;

  // Display player stats in a separate section
  displayPlayerStats(player);
  fetchPlayerLast5Games(playerId);
}

// Display basic player stats
function displayPlayerStats(player) {
  const statsTable = document.getElementById('player-stats-table');
  statsTable.innerHTML = `
    <tr>
      <th>Name</th>
      <td>${player.name}</td>
    </tr>
    <tr>
      <th>Team</th>
      <td>${player.team}</td>
    </tr>
    <tr>
      <th>Points</th>
      <td>${player.points}</td>
    </tr>
    <tr>
      <th>Assists</th>
      <td>${player.assists}</td>
    </tr>
    <tr>
      <th>Rebounds</th>
      <td>${player.rebounds}</td>
    </tr>
  `;
}

// Fetch last 5 games data for the selected player
function fetchPlayerLast5Games(playerId) {
  // Placeholder: Replace with real API endpoint for player games
  const gamesUrl = `https://api.example.com/player/${playerId}/last5games`;  // Replace with actual API URL
  fetch(gamesUrl)
    .then(response => response.json())
    .then(games => {
      const gameStats = games.map(game => ({
        date: game.date,
        points: game.points,
        assists: game.assists,
        rebounds: game.rebounds,
      }));
      generatePlayerGamesChart(gameStats);  // Generate chart based on the last 5 games
    })
    .catch(error => console.error('Error fetching game stats:', error));
}

// Function to generate chart for last 5 games stats
function generatePlayerGamesChart(gameStats) {
  const ctx = document.getElementById('gameStatsChart').getContext('2d');
  const dates = gameStats.map(game => game.date);
  const points = gameStats.map(game => game.points);
  const assists = gameStats.map(game => game.assists);
  const rebounds = gameStats.map(game => game.rebounds);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Points',
          data: points,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Assists',
          data: assists,
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Rebounds',
          data: rebounds,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
        },
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Game Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Stats'
          }
        }
      }
    }
  });
}

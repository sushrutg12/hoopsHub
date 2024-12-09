let playersData = [];
let chosenPlayers = []; // List to store chosen players
let playerStatsChart = null; // Chart instance
let debounceTimer = null; // Timer for debouncing input
let activeSearchRequest = null; // Track active API request
let playerDatasetColors = ['rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)']; // Colors for datasets

// Fetch players dynamically based on search input
async function fetchPlayersBySearch(query) {
  if (activeSearchRequest) {
    activeSearchRequest.abort(); // Cancel the previous request if it's still pending
  }

  const controller = new AbortController();
  activeSearchRequest = controller; // Set the current request
  const url = `https://api-nba-v1.p.rapidapi.com/players?search=${query}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': 'f5947c3ed2mshbe927e427ea9644p1115a4jsnf07b6e8e02c9',
      'x-rapidapi-host': 'api-nba-v1.p.rapidapi.com'
    },
    signal: controller.signal // Attach the abort signal
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    const players = result.response || [];
    displaySuggestions(players); // Show results as suggestions
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Error fetching players:", error);
    }
  } finally {
    activeSearchRequest = null; // Clear the active request
  }
}

// Display suggestions based on fetched players
function displaySuggestions(players) {
  const suggestionsBox = document.getElementById('suggestions-box');
  suggestionsBox.innerHTML = ''; // Clear existing suggestions

  if (players.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'suggestion-item';
    noResults.textContent = 'No players found';
    suggestionsBox.appendChild(noResults);
    return;
  }

  players.forEach(player => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.textContent = `${player.firstname} ${player.lastname}`;
    suggestionItem.addEventListener('click', () => {
      document.getElementById('search-input').value = suggestionItem.textContent;
      clearSuggestions();
      getPlayerStats(player.id, `${player.firstname} ${player.lastname}`); // Fetch stats for the selected player
    });
    suggestionsBox.appendChild(suggestionItem);
  });
}

// Clear suggestions box
function clearSuggestions() {
  const suggestionsBox = document.getElementById('suggestions-box');
  suggestionsBox.innerHTML = '';
}

// Search for players with debouncing
document.getElementById('search-input').addEventListener('input', function () {
  const query = this.value.trim();
  clearTimeout(debounceTimer); // Clear the previous timer
  if (query.length >= 3) {
    debounceTimer = setTimeout(() => {
      fetchPlayersBySearch(query); // Fetch players after debounce delay
    }, 300); // Adjust the debounce delay as needed (300ms is common)
  } else {
    clearSuggestions(); // Clear suggestions for shorter queries
  }
});

// Fetch player stats and update the table
async function getPlayerStats(playerId, playerName) {
  if (chosenPlayers.some(player => player.name === playerName)) {
    alert(`${playerName} is already in the table.`);
    return;
  }

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

    if (!playerStats || playerStats.length === 0) {
      alert('No stats available for this player.');
      return;
    }

    const last5Games = playerStats.slice(-5);

    const stats = {
      points: last5Games.map(game => game.points || 0),
      assists: last5Games.map(game => game.assists || 0),
      rebounds: last5Games.map(game => game.totReb || 0),
    };

    const teamName = last5Games[0]?.team.name || 'Unknown';

    chosenPlayers.push({ id: playerId, name: playerName, team: teamName, stats });
    updateTable(playerName, teamName, stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
  }
}

// Update table with player stats
function updateTable(playerName, teamName, stats) {
  const tableBody = document.querySelector("#player-stats-table tbody");

  const row = document.createElement("tr");
  row.setAttribute('id', `row-${playerName}`); // Add an ID to the row for easier deletion
  row.innerHTML = `
    <td><input type="checkbox" onchange="toggleVisualization('${playerName}')"></td>
    <td>${playerName}</td>
    <td>${teamName}</td>
    <td>${(stats.points.reduce((a, b) => a + b) / stats.points.length).toFixed(2)}</td>
    <td>${(stats.assists.reduce((a, b) => a + b) / stats.assists.length).toFixed(2)}</td>
    <td>${(stats.rebounds.reduce((a, b) => a + b) / stats.rebounds.length).toFixed(2)}</td>
    <td><button onclick="deletePlayer('${playerName}')" class="delete-button">Delete</button></td>
  `;
  tableBody.appendChild(row);
}

// Function to delete a player
function deletePlayer(playerName) {
  // Remove the player from the chosenPlayers list
  chosenPlayers = chosenPlayers.filter(player => player.name !== playerName);

  // Remove the player's row from the table
  const row = document.getElementById(`row-${playerName}`);
  if (row) row.remove();

  // Update the chart
  updateChart();
}

// Update the chart with selected players
function updateChart() {
  const selectedPlayers = chosenPlayers.filter(p =>
    document.querySelector(`input[onchange="toggleVisualization('${p.name}')"]`).checked
  );

  const chartData = {
    labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
    datasets: selectedPlayers.map((player, i) => ({
      label: player.name,
      data: player.stats.points,
      borderColor: playerDatasetColors[i % playerDatasetColors.length],
      tension: 0.3,
      fill: false,
    })),
  };

  if (playerStatsChart) playerStatsChart.destroy();

  const ctx = document.getElementById('gamePointsChart').getContext('2d');
  playerStatsChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: '#fff', // Set text color for the legend
          },
        },
        tooltip: {
          titleColor: '#fff', // Tooltip title text color
          bodyColor: '#fff', // Tooltip body text color
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Games',
            color: '#fff', // X-axis title color
          },
          ticks: {
            color: '#fff', // X-axis tick color
          },
        },
        y: {
          title: {
            display: true,
            text: 'Points',
            color: '#fff', // Y-axis title color
          },
          ticks: {
            color: '#fff', // Y-axis tick color
          },
          beginAtZero: true,
        },
      },
    },
  });
}

// Toggle visualization when a checkbox is clicked
function toggleVisualization(playerName) {
  updateChart(); // Simply update the chart to reflect the current selected players
}
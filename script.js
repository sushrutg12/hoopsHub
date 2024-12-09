let playersData = [];
let chosenPlayers = []; // List to store chosen players
let playerID = 0;
let Name = "";
let teamName = "";
let debounceTimer = null; // Timer for debouncing input
let activeSearchRequest = null; // Track active API request

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
  // Check if the player is already in the chosenPlayers list
  if (chosenPlayers.includes(playerName)) {
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

    let totalPoints = 0;
    let totalAssists = 0;
    let totalRebounds = 0;

    last5Games.forEach(game => {
      totalPoints += game.points || 0;
      totalAssists += game.assists || 0;
      totalRebounds += game.totReb || 0;
    });

    const avgPoints = totalPoints / last5Games.length;
    const avgAssists = totalAssists / last5Games.length;
    const avgRebounds = totalRebounds / last5Games.length;

    const lastGame = playerStats[0];
    teamName = lastGame.team.name;

    // Store chosen player
    storeChosenPlayer(playerName);

    // Update the table with player stats
    updateTableWithAverages(playerName, avgPoints, avgAssists, avgRebounds, teamName);
  } catch (error) {
    console.error('Error fetching player stats:', error);
  }
}

// Update table with player stats
function updateTableWithAverages(playerName, avgPoints, avgAssists, avgRebounds, teamName) {
  const tableBody = document.querySelector("#player-stats-table tbody");

  // Append a new row for the player
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${playerName}</td>
    <td>${teamName}</td>
    <td>${avgPoints.toFixed(2)}</td>
    <td>${avgAssists.toFixed(2)}</td>
    <td>${avgRebounds.toFixed(2)}</td>
  `;
  tableBody.appendChild(row);
}

// Store chosen player in the list
function storeChosenPlayer(playerName) {
  if (!chosenPlayers.includes(playerName)) {
    chosenPlayers.push(playerName);
    console.log("Chosen players:", chosenPlayers); // Log the list for verification
  }
}
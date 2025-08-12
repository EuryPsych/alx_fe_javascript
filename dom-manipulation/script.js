// Server simulation constants
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL = 30000; // 30 seconds

// Global variables
let quotes = [];
let currentFilter = 'all';
let lastSyncTime = null;
let conflicts = [];
let syncInterval;

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const addQuoteForm = document.getElementById('addQuoteForm');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const categoryTags = document.getElementById('categoryTags');
const syncStatus = document.getElementById('syncStatus');
const syncNowBtn = document.getElementById('syncNow');
const conflictResolution = document.getElementById('conflictResolution');
const conflictItems = document.getElementById('conflictItems');

// Initialize the app
function init() {
  // Load quotes from localStorage
  loadQuotes();
  
  // Set up event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  showFormBtn.addEventListener('click', showForm);
  exportBtn.addEventListener('click', exportQuotes);
  categoryFilter.addEventListener('change', filterQuotes);
  syncNowBtn.addEventListener('click', syncQuotes);
  
  // Populate categories and restore last filter
  populateCategories();
  restoreLastFilter();
  
  // Show initial random quote
  showRandomQuote();
  
  // Initialize sync
  initSync();
}

// Load quotes from localStorage
function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  const savedSyncTime = localStorage.getItem('lastSyncTime');
  
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    // Default quotes if none are saved
    quotes = [
      { id: Date.now(), text: "The only way to do great work is to love what you do.", category: "work", version: 1 },
      { id: Date.now()+1, text: "Life is what happens when you're busy making other plans.", category: "life", version: 1 },
      { id: Date.now()+2, text: "In the middle of difficulty lies opportunity.", category: "inspiration", version: 1 }
    ];
    saveQuotes();
  }
  
  if (savedSyncTime) {
    lastSyncTime = new Date(savedSyncTime);
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
  localStorage.setItem('lastFilter', currentFilter);
  localStorage.setItem('lastSyncTime', new Date().toISOString());
}

// Populate categories dropdown and tags
function populateCategories() {
  // Get all unique categories
  const categories = ['all', ...new Set(quotes.map(quote => quote.category))];
  
  // Clear existing options
  categoryFilter.innerHTML = '';
  categoryTags.innerHTML = '';
  
  // Add new options to dropdown
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All Categories' : category;
    categoryFilter.appendChild(option);
    
    // Add category tags
    if (category !== 'all') {
      const tag = document.createElement('span');
      tag.className = 'category-tag';
      tag.textContent = category;
      tag.addEventListener('click', () => {
        currentFilter = category;
        categoryFilter.value = category;
        saveQuotes();
        filterQuotes();
        updateActiveTags();
      });
      categoryTags.appendChild(tag);
    }
  });
  
  updateActiveTags();
}

// Update active tag styling
function updateActiveTags() {
  document.querySelectorAll('.category-tag').forEach(tag => {
    tag.classList.toggle('active', tag.textContent === currentFilter);
  });
}

// Restore last selected filter
function restoreLastFilter() {
  const savedFilter = localStorage.getItem('lastFilter');
  if (savedFilter) {
    currentFilter = savedFilter;
    categoryFilter.value = savedFilter;
  }
}

// Filter quotes based on selected category
function filterQuotes() {
  currentFilter = categoryFilter.value;
  saveQuotes();
  updateActiveTags();
  showRandomQuote();
}

// Display a random quote from filtered list
function showRandomQuote() {
  let filteredQuotes = currentFilter === 'all' 
    ? [...quotes] 
    : quotes.filter(quote => quote.category === currentFilter);
  
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = '<p>No quotes found in this category. Add some!</p>';
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  
  quoteDisplay.innerHTML = `
    <p class="quote-text">"${quote.text}"</p>
    <p class="quote-category">Category: ${quote.category}</p>
  `;
  
  // Store last viewed quote in sessionStorage
  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
}

// Show the add quote form
function showForm() {
  addQuoteForm.style.display = 'block';
}

// Hide the add quote form
function hideForm() {
  addQuoteForm.style.display = 'none';
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// Add a new quote
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();
  
  if (!text || !category) {
    alert('Please enter both quote text and category');
    return;
  }
  
  const newQuote = { 
    id: Date.now(), 
    text, 
    category, 
    version: 1,
    localModified: new Date().toISOString(),
    synced: false
  };
  
  quotes.push(newQuote);
  
  // Update UI and storage
  saveQuotes();
  populateCategories();
  hideForm();
  showRandomQuote();
  
  // Mark that we have unsynced changes
  localStorage.setItem('hasUnsyncedChanges', 'true');
}

// Export quotes to JSON file
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = 'quotes.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Import quotes from JSON file
function importQuotes() {
  const file = importFile.files[0];
  if (!file) {
    alert('Please select a file first');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) {
        throw new Error('Invalid format: Expected an array of quotes');
      }
      
      quotes = importedQuotes;
      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert(`Successfully imported ${importedQuotes.length} quotes!`);
      importFile.value = '';
      
      // Mark that we have unsynced changes
      localStorage.setItem('hasUnsyncedChanges', 'true');
    } catch (error) {
      alert('Error importing quotes: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// 1. fetchQuotesFromServer - REQUIRED FUNCTION
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const serverData = await response.json();
    
    // Transform to our quote format
    return serverData.slice(0, 5).map(post => ({
      id: post.id,
      text: post.title,
      category: 'server',
      version: post.id % 10 + 1,
      serverModified: new Date().toISOString()
    }));
  } catch (error) {
    console.error('fetchQuotesFromServer failed:', error);
    showSyncStatus('Failed to fetch from server', 'sync-error');
    throw error;
  }
}

// 2. postQuotesToServer - REQUIRED FUNCTION
async function postQuotesToServer(quotesToSend) {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      body: JSON.stringify(quotesToSend),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('postQuotesToServer failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 3. syncQuotes - REQUIRED FUNCTION
async function syncQuotes() {
  try {
    showSyncStatus('Starting synchronization...', 'sync-info');
    
    // Step 1: Fetch quotes from server
    const serverQuotes = await fetchQuotesFromServer();
    
    // Step 2: Get unsynced local quotes
    const unsyncedQuotes = quotes.filter(q => q.localModified && !q.synced);
    
    // Step 3: Push local changes to server
    if (unsyncedQuotes.length > 0) {
      const result = await postQuotesToServer(unsyncedQuotes);
      if (result.success) {
        // Mark quotes as synced
        quotes.forEach(q => {
          if (q.localModified) q.synced = true;
        });
        saveQuotes();
      }
    }
    
    // Step 4: Check for conflicts
    conflicts = checkForConflicts(serverQuotes);
    if (conflicts.length > 0) {
      showConflicts();
      showSyncStatus(`${conflicts.length} conflicts detected`, 'sync-conflict');
    } else {
      mergeQuotes(serverQuotes);
      showSyncStatus('Sync completed successfully', 'sync-success');
    }
    
    // Update last sync time
    lastSyncTime = new Date();
    localStorage.setItem('lastSyncTime', lastSyncTime.toISOString());
    localStorage.removeItem('hasUnsyncedChanges');
    
  } catch (error) {
    console.error('syncQuotes failed:', error);
    showSyncStatus('Sync failed: ' + error.message, 'sync-error');
  }
}

// Initialize periodic sync
function initSync() {
  // Initial sync
  syncQuotes();
  
  // Set up periodic sync
  syncInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncQuotes();
    }
  }, SYNC_INTERVAL);
  
  // Also sync when window gains focus
  window.addEventListener('focus', syncQuotes);
}

// Check for conflicts between local and server quotes
function checkForConflicts(serverQuotes) {
  const detectedConflicts = [];
  
  // Create a map of server quotes for easy lookup
  const serverMap = new Map();
  serverQuotes.forEach(quote => serverMap.set(quote.id, quote));
  
  // Check each local quote against server version
  quotes.forEach(localQuote => {
    if (serverMap.has(localQuote.id)) {
      const serverQuote = serverMap.get(localQuote.id);
      if (serverQuote.version !== localQuote.version) {
        detectedConflicts.push({
          id: localQuote.id,
          local: localQuote,
          server: serverQuote
        });
      }
    }
  });
  
  // Also check for new quotes from server
  serverQuotes.forEach(serverQuote => {
    if (!quotes.some(q => q.id === serverQuote.id)) {
      detectedConflicts.push({
        id: serverQuote.id,
        local: null,
        server: serverQuote
      });
    }
  });
  
  return detectedConflicts;
}

// Show conflicts in UI
function showConflicts() {
  conflictItems.innerHTML = '';
  
  conflicts.forEach(conflict => {
    const conflictItem = document.createElement('div');
    conflictItem.className = 'conflict-item';
    
    if (conflict.local && conflict.server) {
      conflictItem.innerHTML = `
        <p><strong>Conflict ID: ${conflict.id}</strong></p>
        <p>Local version (v${conflict.local.version}): ${conflict.local.text}</p>
        <p>Server version (v${conflict.server.version}): ${conflict.server.text}</p>
      `;
    } else if (conflict.server) {
      conflictItem.innerHTML = `
        <p><strong>New quote from server: ID ${conflict.id}</strong></p>
        <p>${conflict.server.text}</p>
      `;
    }
    
    conflictItems.appendChild(conflictItem);
  });
  
  conflictResolution.style.display = 'block';
}

// Resolve conflicts based on user choice
function resolveConflicts(resolutionType) {
  switch (resolutionType) {
    case 'server':
      // Use server version for all conflicts
      conflicts.forEach(conflict => {
        if (conflict.server) {
          const existingIndex = quotes.findIndex(q => q.id === conflict.id);
          if (existingIndex >= 0) {
            quotes[existingIndex] = conflict.server;
          } else {
            quotes.push(conflict.server);
          }
        }
      });
      break;
      
    case 'local':
      // Keep local version for all conflicts
      conflicts.forEach(conflict => {
        if (conflict.local && conflict.server) {
          const existingIndex = quotes.findIndex(q => q.id === conflict.id);
          if (existingIndex >= 0) {
            quotes[existingIndex].version = conflict.server.version;
          }
        }
      });
      break;
      
    case 'merge':
      // Merge changes - for demo we'll take the longer text
      conflicts.forEach(conflict => {
        if (conflict.local && conflict.server) {
          const existingIndex = quotes.findIndex(q => q.id === conflict.id);
          if (existingIndex >= 0) {
            const mergedQuote = {
              ...conflict.local,
              text: conflict.local.text.length > conflict.server.text.length 
                ? conflict.local.text 
                : conflict.server.text,
              version: conflict.server.version + 1
            };
            quotes[existingIndex] = mergedQuote;
          }
        } else if (conflict.server) {
          quotes.push(conflict.server);
        }
      });
      break;
  }
  
  // Save and refresh
  saveQuotes();
  populateCategories();
  showRandomQuote();
  
  // Hide conflict resolution
  conflictResolution.style.display = 'none';
  conflicts = [];
  
  showSyncStatus('Conflicts resolved', 'sync-success');
}

// Merge server quotes with local quotes
function mergeQuotes(serverQuotes) {
  // Create a map of local quotes for easy lookup
  const localQuoteMap = new Map();
  quotes.forEach(quote => localQuoteMap.set(quote.id, quote));
  
  // Update or add server quotes
  serverQuotes.forEach(serverQuote => {
    if (localQuoteMap.has(serverQuote.id)) {
      const localQuote = localQuoteMap.get(serverQuote.id);
      // Update if server version is newer
      if (serverQuote.version > localQuote.version) {
        Object.assign(localQuote, serverQuote);
      }
    } else {
      // Add new quote from server
      quotes.push(serverQuote);
    }
  });
  
  saveQuotes();
}

// Show sync status message
function showSyncStatus(message, type) {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status ${type}`;
  syncStatus.style.display = 'block';
  
  // Hide after 5 seconds
  setTimeout(() => {
    syncStatus.style.display = 'none';
  }, 5000);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
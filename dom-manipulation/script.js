// Initial quotes data (will be loaded from localStorage)
let quotes = [];
let currentFilter = 'all';

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const addQuoteForm = document.getElementById('addQuoteForm');
const categoryFilter = document.getElementById('categoryFilter');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const categoryTags = document.getElementById('categoryTags');

// Initialize the app
function init() {
  // Load quotes from localStorage
  loadQuotes();
  
  // Set up event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  showFormBtn.addEventListener('click', showForm);
  exportBtn.addEventListener('click', exportQuotes);
  categoryFilter.addEventListener('change', filterQuotes);
  
  // Populate categories and restore last filter
  populateCategories();
  restoreLastFilter();
  
  // Show initial random quote
  showRandomQuote();
}

// Load quotes from localStorage
function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    // Default quotes if none are saved
    quotes = [
      { text: "The only way to do great work is to love what you do.", category: "work" },
      { text: "Life is what happens when you're busy making other plans.", category: "life" },
      { text: "In the middle of difficulty lies opportunity.", category: "inspiration" },
      { text: "Simplicity is the ultimate sophistication.", category: "design" },
      { text: "The best way to predict the future is to invent it.", category: "technology" }
    ];
    saveQuotes();
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
  localStorage.setItem('lastFilter', currentFilter);
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
  
  const newQuote = { text, category };
  quotes.push(newQuote);
  
  // Update UI and storage
  saveQuotes();
  populateCategories();
  hideForm();
  showRandomQuote();
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
    } catch (error) {
      alert('Error importing quotes: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
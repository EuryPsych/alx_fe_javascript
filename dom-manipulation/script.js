// Initial quotes data
let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "work" },
  { text: "Life is what happens when you're busy making other plans.", category: "life" },
  { text: "In the middle of difficulty lies opportunity.", category: "inspiration" },
  { text: "Simplicity is the ultimate sophistication.", category: "design" },
  { text: "The best way to predict the future is to invent it.", category: "technology" }
];

// DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showFormBtn = document.getElementById('showForm');
const addQuoteForm = document.getElementById('addQuoteForm');
const categorySelect = document.getElementById('categorySelect');

// Current filter
let currentFilter = 'all';

// Initialize the app
function init() {
  // Set up event listeners
  newQuoteBtn.addEventListener('click', showRandomQuote);
  showFormBtn.addEventListener('click', showForm);
  
  // Populate category filter
  updateCategoryFilter();
  
  // Show initial random quote
  showRandomQuote();
}

// Display a random quote
function showRandomQuote() {
  let filteredQuotes = quotes;
  
  if (currentFilter !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === currentFilter);
  }
  
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
}

// Show the add quote form
function showForm() {
  addQuoteForm.style.display = 'block';
}

// Hide the add quote form
function hideForm() {
  addQuoteForm.style.display = 'none';
  // Clear the form
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
  
  // Update UI
  updateCategoryFilter();
  hideForm();
  showRandomQuote();
  
  console.log('Quote added:', newQuote);
}

// Update the category filter dropdown
function updateCategoryFilter() {
  // Get all unique categories
  const categories = ['all', ...new Set(quotes.map(quote => quote.category))];
  
  // Clear existing options
  categorySelect.innerHTML = '';
  
  // Add new options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All Categories' : category;
    categorySelect.appendChild(option);
  });
  
  // Set up event listener for filter change
  categorySelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    showRandomQuote();
  });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
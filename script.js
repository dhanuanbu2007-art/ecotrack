// Emission Factors
const FACTORS = {
    transport: {
        car: 0.192,     // kg CO2 per km
        bus: 0.105,
        train: 0.041,
        ev: 0.053,
        bike: 0
    },
    electricity: 0.233, // kg CO2 per kWh (Average global estimate)
    food: {
        'heavy-meat': 7.2, // kg CO2 per day
        'omnivore': 5.6,
        'vegetarian': 3.8,
        'vegan': 2.9
    }
};

// DOM Elements
const form = document.getElementById('calculator-form');
const resultsSection = document.getElementById('results-section');
const totalCo2El = document.getElementById('total-co2');
const barTravel = document.getElementById('bar-travel');
const barElectricity = document.getElementById('bar-electricity');
const barFood = document.getElementById('bar-food');
const valTravel = document.getElementById('val-travel');
const valElectricity = document.getElementById('val-electricity');
const valFood = document.getElementById('val-food');
const suggestionsList = document.getElementById('suggestions-list');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

// State
let history = JSON.parse(localStorage.getItem('ecotrack_history')) || [];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});

// Form Submit Handler
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get Inputs
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const transportType = document.getElementById('transport').value;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const foodType = document.getElementById('food').value;

    // Calculate Annual Emissions
    const travelAnnual = distance * FACTORS.transport[transportType] * 365;
    const electricityAnnual = electricity * FACTORS.electricity * 12;
    const foodAnnual = FACTORS.food[foodType] * 365;
    
    const totalAnnual = travelAnnual + electricityAnnual + foodAnnual;

    // Data object
    const resultData = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        total: Math.round(totalAnnual),
        travel: travelAnnual,
        electricity: electricityAnnual,
        food: foodAnnual,
        transportType,
        foodType
    };

    // Update UI
    displayResults(resultData);
    saveToHistory(resultData);
});

// Display Results
function displayResults(data) {
    resultsSection.style.display = 'block';
    
    // Smooth scroll to results on mobile
    if (window.innerWidth < 900) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Animate Total Number
    animateValue(totalCo2El, parseInt(totalCo2El.innerText), data.total, 1500);

    // Calculate percentages
    const travelPct = (data.travel / data.total) * 100;
    const elecPct = (data.electricity / data.total) * 100;
    const foodPct = (data.food / data.total) * 100;

    // Update Bars
    setTimeout(() => {
        barTravel.style.setProperty('--width', `${travelPct}%`);
        barElectricity.style.setProperty('--width', `${elecPct}%`);
        barFood.style.setProperty('--width', `${foodPct}%`);
    }, 100);

    valTravel.innerText = `${Math.round(travelPct)}%`;
    valElectricity.innerText = `${Math.round(elecPct)}%`;
    valFood.innerText = `${Math.round(foodPct)}%`;

    // Generate Suggestions
    generateSuggestions(data, travelPct, elecPct, foodPct);
}

// Generate Personalized Suggestions
function generateSuggestions(data, travelPct, elecPct, foodPct) {
    suggestionsList.innerHTML = '';
    const suggestions = [];

    // Travel Suggestions
    if (data.transportType === 'car') {
        suggestions.push("Consider carpooling, using public transit, or switching to an EV to significantly reduce your travel footprint.");
    } else if (data.transportType === 'ev' && travelPct > 30) {
        suggestions.push("Even with an EV, reducing total travel distance or walking/biking for short trips helps lower impact.");
    }
    
    if (data.transportType !== 'bike' && data.travel > 5 * FACTORS.transport['car'] * 365) {
        suggestions.push("Try substituting one or two short drives a week with walking or cycling.");
    }

    // Electricity Suggestions
    if (elecPct > 40 || data.electricity > 300) {
        suggestions.push("Your home energy use is high. Try switching to LED bulbs, unplugging idle devices, or lowering your thermostat slightly.");
    }
    
    // Food Suggestions
    if (data.foodType === 'heavy-meat') {
        suggestions.push("Adopting a 'Meatless Monday' or substituting beef with chicken/plant-based proteins can drastically cut your food emissions.");
    } else if (data.foodType === 'omnivore' && foodPct > 40) {
        suggestions.push("Consider shifting towards more plant-based meals a few days a week.");
    }

    // General praise if footprint is relatively low
    if (data.total < 4000) {
        suggestions.push("Great job! Your footprint is well below the global average. Keep up the sustainable habits!");
    }

    // Default suggestion if list is empty
    if (suggestions.length === 0) {
        suggestions.push("Every small action counts! Keep exploring ways to minimize waste and energy use in your daily life.");
    }

    // Render suggestions
    suggestions.forEach(text => {
        const li = document.createElement('li');
        li.innerText = text;
        suggestionsList.appendChild(li);
    });
}

// Save to LocalStorage
function saveToHistory(data) {
    history.unshift(data);
    // Keep only last 10 entries
    if (history.length > 10) history.pop();
    
    localStorage.setItem('ecotrack_history', JSON.stringify(history));
    renderHistory();
}

// Render History List
function renderHistory() {
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No past calculations found.</p>';
        clearHistoryBtn.style.display = 'none';
        return;
    }

    clearHistoryBtn.style.display = 'block';

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <span class="history-date">${item.date}</span>
            <span class="history-value">${item.total.toLocaleString()} kg</span>
        `;
        historyList.appendChild(div);
    });
}

// Clear History Handler
clearHistoryBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your calculation history?")) {
        history = [];
        localStorage.removeItem('ecotrack_history');
        renderHistory();
    }
});

// Utility: Animate Number Counter
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function (easeOutQuart)
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        obj.innerHTML = Math.floor(easeProgress * (end - start) + start).toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toLocaleString();
        }
    };
    window.requestAnimationFrame(step);
}

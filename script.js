document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const wheelCanvas = document.getElementById('wheelCanvas');
    const spinButton = document.getElementById('spinButton');
    const nameInput = document.getElementById('nameInput');
    const addButton = document.getElementById('addButton');
    const namesList = document.getElementById('namesList');
    const itemCount = document.getElementById('itemCount');
    const pasteButton = document.getElementById('pasteButton');
    const sampleButton = document.getElementById('sampleButton');
    const clearButton = document.getElementById('clearButton');
    const spinTime = document.getElementById('spinTime');
    const spinTimeValue = document.getElementById('spinTimeValue');
    const wheelTheme = document.getElementById('wheelTheme');
    const soundToggle = document.getElementById('soundToggle');
    const resultsSidebar = document.getElementById('resultsSidebar');
    const resultsToggle = document.getElementById('resultsToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const resultsList = document.getElementById('resultsList');
    const resultsBadge = document.getElementById('resultsBadge');
    const resultModal = document.getElementById('resultModal');
    const winnerName = document.getElementById('winnerName');
    const spinAgain = document.getElementById('spinAgain');
    const closeModal = document.getElementById('closeModal');
    const exportResults = document.getElementById('exportResults');
    const clearResults = document.getElementById('clearResults');
    
    // Audio elements
    const spinSound = document.getElementById('spinSound');
    const winSound = document.getElementById('winSound');
    const tickSound = document.getElementById('tickSound');
    
    // App state
    let items = [];
    let results = [];
    let isSpinning = false;
    let currentAngle = 0;
    let spinTimeout;
    let ctx = wheelCanvas.getContext('2d');
    let wheelSize = Math.min(wheelCanvas.width, wheelCanvas.height);
    let center = wheelSize / 2;
    let radius = center - 20;
    
    // Color themes
    const themes = {
        vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607', '#8338EC', '#3A86FF'],
        pastel: ['#FFD3B6', '#FFAAA5', '#FF8B94', '#D4A5A5', '#9CECDB', '#A0E7E5', '#B5F2EA'],
        monochrome: ['#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA', '#ADB5BD', '#6C757D', '#495057'],
        rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
    };
    
    // Initialize the app
    function init() {
        loadFromLocalStorage();
        renderWheel();
        setupEventListeners();
        updateItemCount();
        updateResultsBadge();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Spin button
        spinButton.addEventListener('click', startSpin);
        
        // Add item
        addButton.addEventListener('click', addItem);
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addItem();
        });
        
        // List management
        pasteButton.addEventListener('click', pasteFromClipboard);
        sampleButton.addEventListener('click', loadSampleData);
        clearButton.addEventListener('click', clearItems);
        
        // Settings
        spinTime.addEventListener('input', function() {
            spinTimeValue.textContent = this.value;
        });
        
        wheelTheme.addEventListener('change', renderWheel);
        soundToggle.addEventListener('change', toggleSounds);
        
        // Results
        resultsToggle.addEventListener('click', toggleSidebar);
        closeSidebar.addEventListener('click', toggleSidebar);
        spinAgain.addEventListener('click', function() {
            resultModal.classList.remove('open');
            startSpin();
        });
        closeModal.addEventListener('click', function() {
            resultModal.classList.remove('open');
        });
        exportResults.addEventListener('click', exportResultsToFile);
        clearResults.addEventListener('click', clearResultsHistory);
    }
    
    // Wheel functions
    function renderWheel() {
        if (items.length === 0) {
            drawEmptyWheel();
            return;
        }
        
        ctx.clearRect(0, 0, wheelSize, wheelSize);
        const selectedTheme = themes[wheelTheme.value];
        const segmentAngle = (2 * Math.PI) / items.length;
        
        // Draw segments
        for (let i = 0; i < items.length; i++) {
            const startAngle = i * segmentAngle + currentAngle;
            const endAngle = (i + 1) * segmentAngle + currentAngle;
            
            // Segment color
            ctx.fillStyle = selectedTheme[i % selectedTheme.length];
            
            // Draw segment
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            // Draw segment border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#333';
            ctx.font = `bold ${Math.min(20, radius / 5)}px Poppins`;
            
            // Truncate text if too long
            const maxTextWidth = radius * 0.7;
            let displayText = items[i].name;
            let textWidth = ctx.measureText(displayText).width;
            
            while (textWidth > maxTextWidth && displayText.length > 3) {
                displayText = displayText.substring(0, displayText.length - 1);
                textWidth = ctx.measureText(displayText + '...').width;
            }
            
            if (displayText.length < items[i].name.length) {
                displayText += '...';
            }
            
            ctx.fillText(displayText, radius - 10, 5);
            ctx.restore();
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(center, center, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function drawEmptyWheel() {
        ctx.clearRect(0, 0, wheelSize, wheelSize);
        
        // Draw empty circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = '#999';
        ctx.font = 'bold 20px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('Add items to begin', center, center - 10);
        ctx.font = '16px Poppins';
        ctx.fillText('Click the + button below', center, center + 20);
    }
    
    function startSpin() {
        if (isSpinning || items.length < 2) return;
        
        isSpinning = true;
        spinButton.classList.add('pulse');
        spinButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        
        // Play spin sound if enabled
        if (soundToggle.checked) {
            spinSound.currentTime = 0;
            spinSound.play();
        }
        
        const spinDuration = parseInt(spinTime.value) * 1000;
        const startTime = performance.now(); // Use performance.now() for more accurate timing
        const rotations = 5 + Math.random() * 3; // 5-8 full rotations
        
        // Calculate final angle (ensure it lands on a segment)
        const segmentAngle = (2 * Math.PI) / items.length;
        const winningSegment = Math.floor(Math.random() * items.length);
        const targetAngle = currentAngle + (rotations * 2 * Math.PI) + (winningSegment * segmentAngle);
        
        // Store the initial angle for reference
        const initialAngle = currentAngle;
        
        function animateSpin(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Cubic easing out function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Calculate current angle using easing
            currentAngle = initialAngle + (easeOut * (targetAngle - initialAngle));
            
            // Play tick sound when passing segments (every 100ms)
            if (soundToggle.checked && elapsed % 100 < 16) {
                tickSound.currentTime = 0;
                tickSound.play();
            }
            
            renderWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                finishSpin(winningSegment);
            }
        }
        
        requestAnimationFrame(animateSpin);
    }
    
    function finishSpin(winningSegment) {
        isSpinning = false;
        spinButton.classList.remove('pulse');
        spinButton.innerHTML = '<i class="fas fa-play"></i>';
        
        // Play win sound if enabled
        if (soundToggle.checked) {
            winSound.currentTime = 0;
            winSound.play();
        }
        
        // Show winner
        const winner = items[winningSegment];
        showWinner(winner.name);
        
        // Add to results
        addResult(winner.name);
        
        // Create confetti effect
        createConfetti();
    }
    
    function showWinner(name) {
        winnerName.textContent = name;
        resultModal.classList.add('open');
    }
    
    function createConfetti() {
        const colors = ['#FF6B6B', '#FFBE0B', '#3A86FF', '#8338EC', '#4ECDC4'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }
    
    // Item management
    function addItem() {
        const name = nameInput.value.trim();
        if (!name) return;
        
        items.push({ name });
        renderWheel();
        updateItemList();
        nameInput.value = '';
        nameInput.focus();
        saveToLocalStorage();
    }
    
    function removeItem(index) {
        items.splice(index, 1);
        renderWheel();
        updateItemList();
        saveToLocalStorage();
    }
    
    function updateItemList() {
        namesList.innerHTML = '';
        
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'name-item';
            itemElement.innerHTML = `
                <span>${item.name}</span>
                <button class="remove-item" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            namesList.appendChild(itemElement);
        });
        
        updateItemCount();
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                removeItem(parseInt(this.dataset.index));
            });
        });
    }
    
    function updateItemCount() {
        itemCount.textContent = items.length;
        spinButton.style.backgroundColor = items.length < 2 ? '#ccc' : 'var(--primary-color)';
    }
    
    function pasteFromClipboard() {
        navigator.clipboard.readText()
            .then(text => {
                const names = text.split('\n')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
                
                if (names.length > 0) {
                    items = names.map(name => ({ name }));
                    renderWheel();
                    updateItemList();
                    saveToLocalStorage();
                }
            })
            .catch(err => {
                console.error('Failed to read clipboard: ', err);
                alert('Failed to read from clipboard. Please make sure you have granted clipboard permissions.');
            });
    }
    
    function loadSampleData() {
        const sampleNames = [
            'Alice', 'Bob', 'Charlie', 'David', 'Eve', 
            'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
            'Team A', 'Team B', 'Team C', 'Team D',
            'Option 1', 'Option 2', 'Option 3'
        ];
        
        items = sampleNames.map(name => ({ name }));
        renderWheel();
        updateItemList();
        saveToLocalStorage();
    }
    
    function clearItems() {
        if (items.length === 0 || confirm('Are you sure you want to clear all items?')) {
            items = [];
            renderWheel();
            updateItemList();
            saveToLocalStorage();
        }
    }
    
    // Results management
    function addResult(name) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        results.unshift({
            name,
            time: timeString
        });
        
        updateResultsList();
        updateResultsBadge();
        saveToLocalStorage();
    }
    
    function updateResultsList() {
        resultsList.innerHTML = '';
        
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            resultElement.innerHTML = `
                <div class="result-name">${result.name}</div>
                <div class="result-time">${result.time}</div>
            `;
            resultsList.appendChild(resultElement);
        });
    }
    
    function updateResultsBadge() {
        resultsBadge.textContent = results.length;
    }
    
    function exportResultsToFile() {
        if (results.length === 0) {
            alert('No results to export');
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Name,Time\n";
        
        results.forEach(result => {
            csvContent += `${result.name},${result.time}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "spinpicker_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function clearResultsHistory() {
        if (results.length === 0 || confirm('Are you sure you want to clear all results?')) {
            results = [];
            updateResultsList();
            updateResultsBadge();
            saveToLocalStorage();
        }
    }
    
    // UI functions
    function toggleSidebar() {
        resultsSidebar.classList.toggle('open');
    }
    
    function toggleSounds() {
        // This is handled by the change event on the checkbox
        saveToLocalStorage();
    }
    
    // Local storage
    function saveToLocalStorage() {
        const appState = {
            items,
            results,
            settings: {
                spinTime: spinTime.value,
                wheelTheme: wheelTheme.value,
                soundEnabled: soundToggle.checked
            }
        };
        
        localStorage.setItem('spinPickerApp', JSON.stringify(appState));
    }
    
    function loadFromLocalStorage() {
        const savedState = localStorage.getItem('spinPickerApp');
        if (!savedState) return;
        
        try {
            const appState = JSON.parse(savedState);
            
            if (appState.items) {
                items = appState.items;
                updateItemList();
            }
            
            if (appState.results) {
                results = appState.results;
                updateResultsList();
                updateResultsBadge();
            }
            
            if (appState.settings) {
                spinTime.value = appState.settings.spinTime || 8;
                spinTimeValue.textContent = spinTime.value;
                wheelTheme.value = appState.settings.wheelTheme || 'vibrant';
                soundToggle.checked = appState.settings.soundEnabled !== false;
            }
            
            renderWheel();
        } catch (e) {
            console.error('Failed to load saved state:', e);
        }
    }
    
    // Initialize the app
    init();
});

const offlineBanner = document.getElementById('offlineBanner');
function updateOnlineStatus() {
    offlineBanner.style.display = navigator.onLine ? 'none' : 'block';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();
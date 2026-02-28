// Variables globales
let currentCategory = '';
let currentMode = '';
let currentType = '';
let usedChallenges = new Set();
let players = [];
let currentPlayerIndex = 0;

// Variables del cronómetro
let timerInterval = null;
let timerSeconds = 0;
let isPaused = false;

// Detección de tiempo en el texto del reto
function detectTime(text) {
    // Patrones comunes: "1 minuto", "30 segundos", "2 minutos"
    const patterns = [
        /(\d+)\s*minuto?s?/i,
        /(\d+)\s*segundo?s?/i,
        /(\d+)\s*min/i,
        /(\d+)\s*seg/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const number = parseInt(match[1]);
            const unit = match[0].toLowerCase();
            
            if (unit.includes('minuto') || unit.includes('min')) {
                return number * 60; // Convertir a segundos
            } else {
                return number;
            }
        }
    }
    return null;
}

// Formatear tiempo MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Iniciar cronómetro
function startTimer(duration) {
    // Limpiar cronómetro previo si existe
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerSeconds = duration;
    isPaused = false;
    
    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('timer-display');
    const timerButton = document.getElementById('timer-button');
    
    timerContainer.style.display = 'flex';
    timerDisplay.textContent = formatTime(timerSeconds);
    timerButton.textContent = '⏸ Pausar';
    
    // Iniciar cuenta regresiva
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timerSeconds--;
            timerDisplay.textContent = formatTime(timerSeconds);
            
            // Cambiar color en los últimos 10 segundos
            if (timerSeconds <= 10 && timerSeconds > 0) {
                timerDisplay.style.color = '#ff6b6b';
            }
            
            // Tiempo terminado
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                onTimerComplete();
            }
        }
    }, 1000);
}

// Pausar/Reanudar cronómetro
function togglePause() {
    isPaused = !isPaused;
    const timerButton = document.getElementById('timer-button');
    timerButton.textContent = isPaused ? '▶ Reanudar' : '⏸ Pausar';
}

// Detener cronómetro
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const timerContainer = document.getElementById('timer-container');
    timerContainer.style.display = 'none';
    isPaused = false;
}

// Tiempo completado
function onTimerComplete() {
    const timerDisplay = document.getElementById('timer-display');
    const timerButton = document.getElementById('timer-button');
    
    timerDisplay.textContent = '¡Tiempo!';
    timerDisplay.style.color = '#4CAF50';
    timerButton.textContent = '✓ Listo';
    
    // Vibración (si está disponible)
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Sonido (opcional)
    playCompletionSound();
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        stopTimer();
    }, 3000);
}

// Reproducir sonido de completado
function playCompletionSound() {
    // AudioContext API para generar un beep
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio no disponible');
    }
}

// Mostrar pantalla de selección de categoría
function showCategorySelection() {
    document.getElementById('consent-screen').style.display = 'none';
    document.getElementById('category-screen').style.display = 'block';
}

// Mostrar pantalla de configuración de jugadores
function showPlayerSetup(category) {
    currentCategory = category;
    document.getElementById('category-screen').style.display = 'none';
    document.getElementById('player-setup').style.display = 'block';
    
    // Si es PAREJA, fijar a 2 jugadores y ocultar selector
    if (category === 'couple') {
        document.getElementById('player-count').value = '2';
        document.getElementById('player-count').disabled = true;
        document.getElementById('player-count').style.display = 'none';
        document.querySelector('.player-config label[for="player-count"]').style.display = 'none';
    } else {
        document.getElementById('player-count').disabled = false;
        document.getElementById('player-count').style.display = 'block';
        document.querySelector('.player-config label[for="player-count"]').style.display = 'block';
    }
    
    updatePlayerInputs();
}

// Configurar jugadores
function setupPlayers() {
    const playerCount = parseInt(document.getElementById('player-count').value);
    players = [];
    
    for (let i = 1; i <= playerCount; i++) {
        const input = document.getElementById(`player${i}-name`);
        if (input && input.value.trim()) {
            players.push(input.value.trim());
        }
    }
    
    if (players.length < 1) {
        alert('Por favor, ingresa al menos un nombre');
        return;
    }
    
    currentPlayerIndex = 0;
    showModeSelection();
}

// Actualizar inputs de jugadores
function updatePlayerInputs() {
    const count = parseInt(document.getElementById('player-count').value);
    const container = document.getElementById('player-names');
    container.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player${i}-name`;
        input.placeholder = `Jugador ${i}`;
        input.className = 'player-input';
        container.appendChild(input);
    }
}

// Mostrar selección de modo
function showModeSelection() {
    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('mode-screen').style.display = 'block';
}

// Seleccionar modo
function selectMode(mode) {
    currentMode = mode;
    document.getElementById('mode-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('mode-indicator').textContent = 
        `${currentCategory === 'couple' ? 'PAREJA' : 'GRUPO'} - ${mode.toUpperCase()}`;
    showChallengeChoice();
}

// Mostrar opciones RETO o VERDAD
function showChallengeChoice() {
    stopTimer();
    
    const challengeText = document.getElementById('challenge-text');
    const timerStartBtn = document.getElementById('timer-start-btn');
    const playerName = players.length > 0 ? players[currentPlayerIndex] : '';
    
    timerStartBtn.style.display = 'none';
    
    challengeText.innerHTML = `
        <div class="challenge-type">${playerName ? playerName + ': ' : ''}Elige tu desafío</div>
        <div class="challenge-choice">
            <button class="btn-choice reto" onclick="showChallenge('reto')">🎯 RETO</button>
            <button class="btn-choice verdad" onclick="showChallenge('verdad')">❓ VERDAD</button>
        </div>
    `;
}

// Girar ruleta (ahora solo muestra elección)
function spinWheel() {
    showChallengeChoice();
}

// Mostrar reto
function showChallenge(type) {
    currentType = type;
    
    // Obtener pool de retos de la categoría CORRECTA
    const pool = challenges[currentCategory][currentMode][currentType];
    
    // Filtrar retos no usados
    const availableChallenges = pool.filter((_, index) => 
        !usedChallenges.has(`${currentCategory}-${currentMode}-${currentType}-${index}`)
    );
    
    // Si no hay retos disponibles, reiniciar
    if (availableChallenges.length === 0) {
        usedChallenges.clear();
        showChallenge(type);
        return;
    }
    
    // Seleccionar reto aleatorio
    const challenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
    const challengeIndex = pool.indexOf(challenge);
    usedChallenges.add(`${currentCategory}-${currentMode}-${currentType}-${challengeIndex}`);
    
    // Mostrar reto
    const challengeText = document.getElementById('challenge-text');
    const playerName = players.length > 0 ? players[currentPlayerIndex] : '';
    const prefix = playerName ? `${playerName}: ` : '';
    
    challengeText.innerHTML = `
        <div class="challenge-type">${currentType === 'reto' ? '🎯 RETO' : '❓ VERDAD'}</div>
        <div class="challenge-content">${prefix}${challenge}</div>
    `;
    
    // Detectar si el reto tiene tiempo
    const duration = detectTime(challenge);
    if (duration) {
        const timerStartBtn = document.getElementById('timer-start-btn');
        timerStartBtn.style.display = 'block';
        timerStartBtn.onclick = () => {
            startTimer(duration);
            timerStartBtn.style.display = 'none'; // OCULTAR botón después de iniciar
        };
    }
    
    // Siguiente jugador
    if (players.length > 0) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
}

// Volver al menú
function backToMenu() {
    stopTimer();
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('category-screen').style.display = 'block';
    usedChallenges.clear();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Aceptar consentimiento
    document.getElementById('accept-btn').addEventListener('click', showCategorySelection);
    
    // Actualizar inputs cuando cambia el número de jugadores
    document.getElementById('player-count').addEventListener('change', updatePlayerInputs);
    
    // Inicializar inputs
    updatePlayerInputs();
});

// Variables globales
let currentCategory = '';
let currentMode = '';
let currentType = '';
let usedChallenges = new Set();
let players = [];
let currentPlayerIndex = 0;
let playerInputCount = 0;
let challengeActive = false; // Estado: si hay un reto activo

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
    
    // Limpiar y crear inputs iniciales
    const container = document.getElementById('player-names');
    container.innerHTML = '';
    playerInputCount = 0;
    
    // Si es PAREJA, crear exactamente 2 inputs y ocultar botón agregar
    if (category === 'couple') {
        addPlayerInput('Jugador 1');
        addPlayerInput('Jugador 2');
        document.getElementById('add-player-btn').style.display = 'none';
    } else {
        // Si es GRUPO, crear 3 inputs iniciales y mostrar botón agregar
        addPlayerInput('Jugador 1');
        addPlayerInput('Jugador 2');
        addPlayerInput('Jugador 3');
        document.getElementById('add-player-btn').style.display = 'block';
    }
}

// Agregar input de jugador
function addPlayerInput(placeholder = '') {
    playerInputCount++;
    const container = document.getElementById('player-names');
    const wrapper = document.createElement('div');
    wrapper.className = 'player-input-wrapper';
    wrapper.id = `player-wrapper-${playerInputCount}`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'player-input';
    input.placeholder = placeholder || `Jugador ${playerInputCount}`;
    input.dataset.playerId = playerInputCount;
    
    wrapper.appendChild(input);
    
    // Solo agregar botón eliminar si es GRUPO y hay más de 3 jugadores
    if (currentCategory === 'group' && playerInputCount > 3) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-player';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => removePlayerInput(playerInputCount);
        wrapper.appendChild(removeBtn);
    }
    
    container.appendChild(wrapper);
}

// Eliminar input de jugador
function removePlayerInput(playerId) {
    const wrapper = document.getElementById(`player-wrapper-${playerId}`);
    if (wrapper) {
        wrapper.remove();
    }
}

// Configurar jugadores
function setupPlayers() {
    players = [];
    
    // Obtener todos los inputs de jugadores
    const inputs = document.querySelectorAll('.player-input');
    inputs.forEach(input => {
        if (input.value.trim()) {
            players.push(input.value.trim());
        }
    });
    
    // Validación según categoría
    if (currentCategory === 'couple') {
        if (players.length < 2) {
            alert('Por favor, ingresa los nombres de ambos jugadores');
            return;
        }
    } else {
        if (players.length < 3) {
            alert('Para modo GRUPO necesitas al menos 3 jugadores');
            return;
        }
    }
    
    currentPlayerIndex = 0;
    showModeSelection();
}

// Mostrar selección de modo
function showModeSelection() {
    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('mode-screen').style.display = 'block';
}

// Seleccionar modo
function selectMode(mode) {
    currentMode = mode;
    challengeActive = false;
    
    document.getElementById('mode-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('mode-indicator').textContent = 
        `${currentCategory === 'couple' ? 'PAREJA' : 'GRUPO'} - ${mode.toUpperCase()}`;
    
    // Ocultar botón Siguiente al inicio
    const nextButton = document.querySelector('.btn-next');
    nextButton.style.display = 'none';
    
    showChallengeChoice();
}

// Mostrar opciones RETO o VERDAD
function showChallengeChoice() {
    stopTimer();
    challengeActive = false; // No hay reto activo aún
    
    const challengeText = document.getElementById('challenge-text');
    const timerStartBtn = document.getElementById('timer-start-btn');
    const playerWheelContainer = document.getElementById('player-wheel-container');
    const nextButton = document.querySelector('.btn-next');
    
    timerStartBtn.style.display = 'none';
    challengeText.innerHTML = '';
    
    // OCULTAR botón "Siguiente Reto" mientras se elige
    nextButton.style.display = 'none';
    
    // Si es GRUPO, mostrar ruleta de jugadores
    if (currentCategory === 'group') {
        playerWheelContainer.style.display = 'flex';
        challengeText.style.display = 'none';
    } else {
        // Si es PAREJA, mostrar directamente la elección
        playerWheelContainer.style.display = 'none';
        challengeText.style.display = 'flex';
        
        const playerName = players.length > 0 ? players[currentPlayerIndex] : '';
        
        challengeText.innerHTML = `
            <div class="challenge-type">${playerName ? playerName + ': ' : ''}Elige tu desafío</div>
            <div class="challenge-choice">
                <button class="btn-choice reto" onclick="showChallenge('reto')">🎯 RETO</button>
                <button class="btn-choice verdad" onclick="showChallenge('verdad')">❓ VERDAD</button>
            </div>
        `;
    }
}

// Seleccionar jugador aleatorio (ruleta)
function selectRandomPlayer() {
    const wheel = document.getElementById('player-wheel');
    const nameDisplay = document.getElementById('player-wheel-name');
    const spinBtn = document.querySelector('.btn-spin');
    
    spinBtn.disabled = true;
    wheel.classList.add('spinning');
    
    // Animación de cambio rápido de nombres
    let counter = 0;
    const maxSpins = 20;
    const spinInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * players.length);
        nameDisplay.textContent = players[randomIndex];
        counter++;
        
        if (counter >= maxSpins) {
            clearInterval(spinInterval);
            
            // Seleccionar jugador final
            currentPlayerIndex = Math.floor(Math.random() * players.length);
            nameDisplay.textContent = players[currentPlayerIndex];
            
            wheel.classList.remove('spinning');
            
            // Esperar 1 segundo y mostrar elección
            setTimeout(() => {
                document.getElementById('player-wheel-container').style.display = 'none';
                document.getElementById('challenge-text').style.display = 'flex';
                
                const challengeText = document.getElementById('challenge-text');
                challengeText.innerHTML = `
                    <div class="challenge-type">${players[currentPlayerIndex]}: Elige tu desafío</div>
                    <div class="challenge-choice">
                        <button class="btn-choice reto" onclick="showChallenge('reto')">🎯 RETO</button>
                        <button class="btn-choice verdad" onclick="showChallenge('verdad')">❓ VERDAD</button>
                    </div>
                `;
                
                spinBtn.disabled = false;
            }, 1000);
        }
    }, 100);
}

// Girar ruleta (ahora solo muestra elección)
function spinWheel() {
    // En GRUPO: solo permitir siguiente reto si ya completó el actual
    if (currentCategory === 'group' && !challengeActive) {
        alert('¡Primero debes completar el reto actual!');
        return;
    }
    
    showChallengeChoice();
}

// Mostrar reto
function showChallenge(type) {
    currentType = type;
    challengeActive = true; // Marcar que hay un reto activo
    
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
    
    challengeText.style.display = 'flex';
    challengeText.innerHTML = `
        <div class="challenge-type">${currentType === 'reto' ? '🎯 RETO' : '❓ VERDAD'}</div>
        <div class="challenge-content">${prefix}${challenge}</div>
    `;
    
    // MOSTRAR botón "Siguiente Reto" ahora que hay un reto activo
    const nextButton = document.querySelector('.btn-next');
    nextButton.style.display = 'block';
    
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
    
    // Siguiente jugador (solo para PAREJA, en GRUPO la ruleta decide)
    if (currentCategory === 'couple' && players.length > 0) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
}

// Volver al menú
function backToMenu() {
    stopTimer();
    
    // Ocultar TODAS las pantallas
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('mode-screen').style.display = 'none';
    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('player-wheel-container').style.display = 'none';
    
    // Mostrar pantalla de categorías
    document.getElementById('category-screen').style.display = 'block';
    
    // Resetear estado
    usedChallenges.clear();
    players = [];
    currentPlayerIndex = 0;
    challengeActive = false;
}

// Volver desde configuración de jugadores
function backFromPlayerSetup() {
    document.getElementById('player-setup').style.display = 'none';
    document.getElementById('category-screen').style.display = 'block';
}

// Volver desde selección de modo
function backFromModeSelection() {
    document.getElementById('mode-screen').style.display = 'none';
    document.getElementById('player-setup').style.display = 'block';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Aceptar consentimiento
    document.getElementById('accept-btn').addEventListener('click', showCategorySelection);
    
    // Habilitar botón solo si checkbox está marcado
    document.getElementById('consent-check').addEventListener('change', function() {
        document.getElementById('accept-btn').disabled = !this.checked;
    });
});

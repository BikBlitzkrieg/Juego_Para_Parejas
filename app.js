// Variables globales
let players = [];
let gameMode = null;
let gameIntensity = null;
let currentSelectedPlayer = null;
let gameState = {
    players: [],
    turns: 0,
    mode: null,
    intensity: null
};

// Funciones de modal personalizado
function showModal(title, message, buttons) {
    const modal = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    
    const buttonContainer = document.getElementById('modalButtons');
    buttonContainer.innerHTML = '';
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        if (btn.secondary) button.className = 'secondary';
        button.onclick = () => {
            hideModal();
            if (btn.callback) btn.callback();
        };
        buttonContainer.appendChild(button);
    });
    
    modal.classList.add('active');
}

function hideModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Manejo de checkbox de consentimiento
document.getElementById('consentCheck').addEventListener('change', function() {
    document.getElementById('acceptWarning').disabled = !this.checked;
});

// Aceptar advertencia
document.getElementById('acceptWarning').addEventListener('click', function() {
    showScreen('setupScreen');
});

// Seleccionar modo de juego
function selectMode(mode) {
    gameMode = mode;
    gameState.mode = mode;
    
    // Actualizar botones visuales
    document.getElementById('coupleBtn').style.opacity = mode === 'couple' ? '1' : '0.5';
    document.getElementById('groupBtn').style.opacity = mode === 'group' ? '1' : '0.5';
    
    // Mostrar sección de participantes
    document.getElementById('playerSetupSection').style.display = 'block';
    
    // Actualizar instrucciones
    const instructions = document.getElementById('participantInstructions');
    if (mode === 'couple') {
        instructions.textContent = 'Añade los nombres de los 2 participantes';
    } else {
        instructions.textContent = 'Añade los nombres de los participantes (mínimo 3 personas)';
    }
    
    // Reset jugadores si cambian de modo
    if (players.length > 0) {
        showModal(
            '⚠️ Cambiar Modo',
            '¿Cambiar de modo borrará la lista de participantes. ¿Continuar?',
            [
                { text: 'Cancelar', secondary: true },
                { text: 'Continuar', callback: () => {
                    players = [];
                    updatePlayerList();
                }}
            ]
        );
    }
}

// Agregar jugador
function addPlayer() {
    const input = document.getElementById('playerName');
    const name = input.value.trim();
    
    if (name && !players.includes(name)) {
        players.push(name);
        updatePlayerList();
        input.value = '';
        input.focus();
    }
}

// Permitir Enter para agregar jugador
document.getElementById('playerName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addPlayer();
    }
});

// Actualizar lista de jugadores
function updatePlayerList() {
    const list = document.getElementById('playerList');
    list.innerHTML = '';
    
    players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.innerHTML = `
            <span>${player}</span>
            <button class="remove-btn" onclick="removePlayer(${index})">Eliminar</button>
        `;
        list.appendChild(item);
    });

    // Habilitar botón según el modo
    const continueBtn = document.getElementById('continueToIntensity');
    const playerInput = document.querySelector('.player-input');
    
    if (gameMode === 'couple') {
        continueBtn.disabled = players.length !== 2;
        if (players.length >= 2) {
            playerInput.style.display = 'none';
        } else {
            playerInput.style.display = 'flex';
        }
    } else if (gameMode === 'group') {
        continueBtn.disabled = players.length < 3;
        playerInput.style.display = 'flex';
    }
}

// Eliminar jugador
function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

// Ir a selección de intensidad
function goToIntensitySelection() {
    if (gameMode === 'couple' && players.length !== 2) {
        showModal('⚠️ Error', 'El modo pareja necesita exactamente 2 participantes', [
            { text: 'Entendido' }
        ]);
        return;
    }
    if (gameMode === 'group' && players.length < 3) {
        showModal('⚠️ Error', 'El modo grupo necesita al menos 3 participantes', [
            { text: 'Entendido' }
        ]);
        return;
    }
    showScreen('intensityScreen');
}

// Seleccionar intensidad y empezar juego
function selectIntensity(intensity) {
    gameIntensity = intensity;
    gameState.intensity = intensity;
    startGame();
}

// Iniciar juego
function startGame() {
    showScreen('gameScreen');
    
    if (gameMode === 'group') {
        // Modo grupo: mostrar ruleta
        createRoulette();
        document.querySelector('.roulette-container').style.display = 'block';
        document.getElementById('rouletteTitle').style.display = 'block';
        document.getElementById('spinButton').style.display = 'block';
    } else {
        // Modo pareja: ocultar ruleta e ir directo a categorías
        document.querySelector('.roulette-container').style.display = 'none';
        document.getElementById('rouletteTitle').style.display = 'none';
        document.getElementById('spinButton').style.display = 'none';
        
        // Iniciar directamente con el primer jugador
        spinRoulette();
    }
}

// Crear ruleta con nombres de jugadores en canvas
function createRoulette() {
    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = 160;
    const centerY = 160;
    const radius = 155;
    
    // Colores con mejor contraste (más oscuros y saturados)
    const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50'];
    const numPlayers = players.length;
    const anglePerPlayer = (2 * Math.PI) / numPlayers;
    const offsetAngle = -anglePerPlayer / 2;
    
    players.forEach((player, index) => {
        const startAngle = (index * anglePerPlayer) - (Math.PI / 2) + offsetAngle;
        const endAngle = startAngle + anglePerPlayer;
        const middleAngle = startAngle + (anglePerPlayer / 2);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(middleAngle);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 18px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 5;
        ctx.fillText(player, radius * 0.65, 5);
        ctx.restore();
    });
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Girar ruleta o alternar jugadores
function spinRoulette() {
    if (gameMode === 'couple') {
        const playerIndex = gameState.turns % 2;
        currentSelectedPlayer = players[playerIndex];
        
        document.getElementById('rouletteStep').style.display = 'none';
        document.getElementById('categoryStep').style.display = 'block';
        document.getElementById('selectedPlayerName').textContent = currentSelectedPlayer;
    } else {
        const roulette = document.getElementById('roulette');
        const spinButton = document.getElementById('spinButton');
        
        spinButton.disabled = true;
        spinButton.textContent = 'Girando...';
        
        const selectedIndex = Math.floor(Math.random() * players.length);
        currentSelectedPlayer = players[selectedIndex];
        
        const degreesPerPlayer = 360 / players.length;
        const playerAngle = selectedIndex * degreesPerPlayer;
        const baseRotation = 2520;
        const totalRotation = baseRotation - playerAngle;
        
        roulette.style.transform = `rotate(${totalRotation}deg)`;
        
        setTimeout(() => {
            spinButton.style.display = 'none';
            document.getElementById('spinResultPlayer').textContent = currentSelectedPlayer;
            document.getElementById('spinResult').style.display = 'block';
        }, 4000);
    }
}

function goToCategories() {
    document.getElementById('rouletteStep').style.display = 'none';
    document.getElementById('categoryStep').style.display = 'block';
    document.getElementById('selectedPlayerName').textContent = currentSelectedPlayer;
}

function selectCategory(category) {
    const modeChalls = challenges[gameMode];
    const intensityChalls = modeChalls[gameIntensity];
    const categoryList = intensityChalls[category];
    
    const randomChallenge = categoryList[Math.floor(Math.random() * categoryList.length)];
    
    document.getElementById('categoryStep').style.display = 'none';
    
    document.getElementById('selectedPlayer').textContent = currentSelectedPlayer;
    document.getElementById('challengeCategory').textContent = getCategoryName(category);
    document.getElementById('challengeText').textContent = randomChallenge;
    document.getElementById('challengeDisplay').style.display = 'block';
}

function getCategoryName(category) {
    const names = {
        'reto': '🔥 Reto',
        'verdad': '💭 Verdad'
    };
    return names[category];
}

function nextTurn() {
    gameState.turns++;
    
    document.getElementById('challengeDisplay').style.display = 'none';
    
    if (gameMode === 'group') {
        document.getElementById('rouletteStep').style.display = 'block';
        document.getElementById('spinResult').style.display = 'none';
        const spinButton = document.getElementById('spinButton');
        spinButton.style.display = 'block';
        spinButton.disabled = false;
        spinButton.textContent = '🎯 Girar Ruleta';
        
        const roulette = document.getElementById('roulette');
        roulette.style.transition = 'none';
        roulette.style.transform = 'rotate(0deg)';
        setTimeout(() => {
            roulette.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        }, 50);
    } else {
        document.getElementById('rouletteStep').style.display = 'block';
        spinRoulette();
    }
}

function restartGame() {
    showModal(
        '🔄 Reiniciar Juego',
        '¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.',
        [
            { text: 'Cancelar', secondary: true },
            { text: 'Reiniciar', callback: () => {
                // Reset todas las variables
                players = [];
                gameMode = null;
                gameIntensity = null;
                currentSelectedPlayer = null;
                gameState = {
                    players: [],
                    turns: 0,
                    mode: null,
                    intensity: null
                };
                
                // Reset UI - Setup Screen
                document.getElementById('playerList').innerHTML = '';
                document.getElementById('playerName').value = '';
                document.getElementById('playerSetupSection').style.display = 'none';
                document.getElementById('coupleBtn').style.opacity = '1';
                document.getElementById('groupBtn').style.opacity = '1';
                document.querySelector('.player-input').style.display = 'flex';
                
                // Reset UI - Game Screen
                document.getElementById('rouletteStep').style.display = 'block';
                document.getElementById('categoryStep').style.display = 'none';
                document.getElementById('challengeDisplay').style.display = 'none';
                document.getElementById('spinResult').style.display = 'none';
                
                // Reset textos
                document.getElementById('selectedPlayerName').textContent = '';
                document.getElementById('spinResultPlayer').textContent = '';
                document.getElementById('selectedPlayer').textContent = '';
                document.getElementById('challengeText').textContent = '';
                
                // Reset botón girar
                const spinButton = document.getElementById('spinButton');
                spinButton.style.display = 'block';
                spinButton.disabled = false;
                spinButton.textContent = '🎯 Girar Ruleta';
                
                // Reset ruleta
                const roulette = document.getElementById('roulette');
                roulette.style.transition = 'none';
                roulette.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    roulette.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
                }, 50);
                
                // Volver a pantalla de setup
                showScreen('setupScreen');
            }}
        ]
    );
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

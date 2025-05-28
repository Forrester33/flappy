/**
 * Flappy Bird Game - Complete Implementation
 * Features: Physics, Collision Detection, Scoring, Audio, Responsive Controls
 */

class FlappyBirdGame {
    constructor() {
        // Canvas and context setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'start'; // 'start', 'ready', 'playing', 'gameOver'
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
        
        // Player and leaderboard
        this.playerName = '';
        this.leaderboard = this.loadLeaderboard();
        
        // Game settings - base values that will scale with score
        this.baseGravity = 0.2;
        this.baseJumpStrength = -3.25;
        this.basePipeSpeed = 2.3;
        this.pipeGap = 150;
        this.pipeWidth = 60;
        
        // Current dynamic values (will be updated based on score)
        this.gravity = this.baseGravity;
        this.jumpStrength = this.baseJumpStrength;
        this.pipeSpeed = this.basePipeSpeed;
        
        // Bird properties
        this.bird = {
            x: 80,
            y: this.canvas.height / 2,
            width: 30,
            height: 25,
            velocity: 0,
            rotation: 0,
            flapFrame: 0
        };
        
        // Pipes array
        this.pipes = [];
        this.pipeSpacing = 200;
        this.lastPipeX = this.canvas.width;
        
        // Background elements
        this.backgroundOffset = 0;
        this.groundOffset = 0;
        
        // Cheat code system
        this.keySequence = '';
        this.keySequenceTimeout = null;
        this.cheatSequence = ['b', 'u', 't', 't', 'e', 'r'];
        this.currentCheatIndex = 0; // Which letter we're expecting next
        this.otterpilot = {
            active: false,
            pipesRemaining: 0
        };
        
        // Audio elements
        this.sounds = {
            flap: document.getElementById('flapSound'),
            score: document.getElementById('scoreSound'),
            gameOver: document.getElementById('gameOverSound')
        };
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalHighScoreElement = document.getElementById('finalHighScore');
        
        // Leaderboard UI elements
        this.playerNameInput = document.getElementById('playerName');
        this.leaderboardScreen = document.getElementById('leaderboardScreen');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.rankingDisplay = document.getElementById('rankingDisplay');
        this.showLeaderboardBtn = document.getElementById('showLeaderboardBtn');
        this.playAgainFromLeaderboardBtn = document.getElementById('playAgainFromLeaderboardBtn');
        this.backToGameBtn = document.getElementById('backToGameBtn');
        
        // Initialize the game
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Update high score display
        this.highScoreElement.textContent = this.highScore;
        
        // Start the game loop
        this.gameLoop();
        
        // Generate initial pipes
        this.generatePipe();
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Leaderboard buttons
        this.showLeaderboardBtn.addEventListener('click', () => {
            this.showLeaderboard();
        });

        this.playAgainFromLeaderboardBtn.addEventListener('click', () => {
            this.restartGame();
        });

        this.backToGameBtn.addEventListener('click', () => {
            this.hideLeaderboard();
        });

        // Player name input
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
        
        // Mouse and touch controls
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing' || this.gameState === 'ready') {
                this.flap();
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing' || this.gameState === 'ready') {
                this.flap();
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (this.gameState === 'playing' || this.gameState === 'ready') {
                    this.flap();
                } else if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restartGame();
                }
            }
            
            // Cheat code detection
            this.handleCheatCode(e);
        });
    }
    
    handleCheatCode(e) {
        // Only track letter keys
        if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
            const typedKey = e.key.toLowerCase();
            const expectedKey = this.cheatSequence[this.currentCheatIndex];
            
            console.log('🧈 Expecting "' + expectedKey + '", got "' + typedKey + '"');
            
            if (typedKey === expectedKey) {
                // Correct key! Activate otterpilot immediately
                this.activateOtterpilot();
                
                // Advance to next letter in sequence
                this.currentCheatIndex++;
                
                // If we've gone through all letters, cycle back to start
                if (this.currentCheatIndex >= this.cheatSequence.length) {
                    this.currentCheatIndex = 0;
                }
                
                const nextKey = this.cheatSequence[this.currentCheatIndex];
                console.log('🧈 Otterpilot activated! Next key will be "' + nextKey + '"');
            } else {
                console.log('🧈 Wrong key! Expected "' + expectedKey + '", got "' + typedKey + '"');
                // Wrong key - don't reset, just ignore it
            }
        }
    }
    
    activateOtterpilot() {
        console.log('🧈 ACTIVATING OTTERPILOT - Current state:', this.gameState);
        
        // Auto-progress through game states if needed
        if (this.gameState === 'start') {
            console.log('🧈 Starting game from start state...');
            this.startGame(); // This sets state to 'ready' and calls resetGame (which clears otterpilot)
            console.log('🧈 Game started, state now:', this.gameState);
            // Re-activate otterpilot after the reset
            this.otterpilot.active = true;
            this.otterpilot.pipesRemaining = 15;
            console.log('🧈 Otterpilot re-activated after reset');
            // Then immediately start playing
            this.gameState = 'playing';
            console.log('🧈 State changed to playing');
        } else if (this.gameState === 'ready') {
            console.log('🧈 Activating from ready state...');
            this.otterpilot.active = true;
            this.otterpilot.pipesRemaining = 15;
            this.gameState = 'playing';
        } else {
            console.log('🧈 Activating from playing state...');
            // Already playing
            this.otterpilot.active = true;
            this.otterpilot.pipesRemaining = 15;
        }
        
        console.log('🧈 Final otterpilot state - Active:', this.otterpilot.active, 'Remaining:', this.otterpilot.pipesRemaining, 'Game state:', this.gameState);
        
        // Test immediate flap to verify otterpilot is working
        if (this.gameState === 'playing') {
            console.log('🧈 Testing immediate flap...');
            this.bird.velocity = this.jumpStrength;
            this.bird.flapFrame = 0;
            console.log('🧈 Immediate flap executed - velocity set to:', this.jumpStrength);
        }
        
        // Visual feedback - flash the screen briefly
        const canvas = this.canvas;
        canvas.style.filter = 'brightness(1.5) saturate(1.5)';
        setTimeout(() => {
            canvas.style.filter = '';
        }, 200);
        
        // Audio feedback if available
        this.playSound('score');
        
        console.log('🧈 BUTTER CHEAT ACTIVATED! Otterpilot for next 15 pipes! 🦦');
    }
    
    startGame() {
        // Get player name
        const name = this.playerNameInput.value.trim();
        if (!name) {
            alert('Please enter your name!');
            this.playerNameInput.focus();
            return;
        }
        
        this.playerName = name;
        this.gameState = 'ready';
        this.startScreen.classList.add('hidden');
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'ready';
        this.gameOverScreen.classList.add('hidden');
        this.leaderboardScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.resetGame();
    }
    
    resetGame() {
        // Reset bird
        this.bird.x = 80;
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.flapFrame = 0;
        
        // Reset pipes
        this.pipes = [];
        this.lastPipeX = this.canvas.width;
        
        // Reset score
        this.score = 0;
        this.scoreElement.textContent = this.score;
        
        // Reset game speed to base values
        this.gravity = this.baseGravity;
        this.jumpStrength = this.baseJumpStrength;
        this.pipeSpeed = this.basePipeSpeed;
        
        // Reset background
        this.backgroundOffset = 0;
        this.groundOffset = 0;
        
        // Reset otterpilot
        this.otterpilot.active = false;
        this.otterpilot.pipesRemaining = 0;
        this.keySequence = '';
        if (this.keySequenceTimeout) {
            clearTimeout(this.keySequenceTimeout);
            this.keySequenceTimeout = null;
        }
        this.currentCheatIndex = 0; // Reset cheat sequence progress
        
        // Generate first pipe
        setTimeout(() => {
            this.generatePipe();
        }, 1000);
    }
    
    flap() {
        // Don't allow manual flapping during otterpilot
        if (this.otterpilot.active) {
            return;
        }
        
        // If in ready state, start the game
        if (this.gameState === 'ready') {
            this.gameState = 'playing';
        }
        
        this.bird.velocity = this.jumpStrength;
        this.bird.flapFrame = 0;
        this.playSound('flap');
    }
    
    generatePipe() {
        const minHeight = 50;
        
        // Variable gap size based on difficulty and randomness
        let baseGap = this.pipeGap; // Start with default gap (150)
        let gapVariance;
        
        // Three-phase progression with dramatic variance
        if (this.score <= 25) {
            // Phase 1 (1-25): Pretty wide gaps with high variance
            if (this.score < 5) {
                baseGap = 280;
                gapVariance = 60; // Gap can be 220-340
            } else if (this.score < 10) {
                baseGap = 260;
                gapVariance = 55; // Gap can be 205-315
            } else if (this.score < 15) {
                baseGap = 240;
                gapVariance = 50; // Gap can be 190-290
            } else if (this.score < 20) {
                baseGap = 220;
                gapVariance = 45; // Gap can be 175-265
            } else {
                baseGap = 200;
                gapVariance = 40; // Gap can be 160-240
            }
        } else if (this.score <= 60) {
            // Phase 2 (26-60): Medium gaps with moderate variance
            if (this.score < 35) {
                baseGap = 180;
                gapVariance = 35; // Gap can be 145-215
            } else if (this.score < 45) {
                baseGap = 165;
                gapVariance = 30; // Gap can be 135-195
            } else if (this.score < 55) {
                baseGap = 150;
                gapVariance = 25; // Gap can be 125-175
            } else {
                baseGap = 140;
                gapVariance = 20; // Gap can be 120-160
            }
        } else {
            // Phase 3 (61+): Narrow but still playable with some variance
            if (this.score < 80) {
                baseGap = 125;
                gapVariance = 15; // Gap can be 110-140
            } else if (this.score < 100) {
                baseGap = 115;
                gapVariance = 12; // Gap can be 103-127
            } else {
                baseGap = 110;
                gapVariance = 10; // Gap can be 100-120
            }
        }
        
        // Calculate actual gap for this pipe
        const actualGap = baseGap + (Math.random() - 0.5) * 2 * gapVariance;
        const finalGap = Math.max(95, Math.min(350, actualGap)); // Ensure gap is between 95-350px
        
        const maxHeight = this.canvas.height - finalGap - minHeight - 100; // 100 for ground
        
        // Progressive difficulty based on score
        let difficultyFactor;
        if (this.score < 5) {
            // Very easy: pipes in middle third of screen
            difficultyFactor = 0.3;
        } else if (this.score < 10) {
            // Easy: pipes in middle half of screen
            difficultyFactor = 0.5;
        } else if (this.score < 20) {
            // Medium: pipes in middle two-thirds of screen
            difficultyFactor = 0.7;
        } else {
            // Hard: pipes can be anywhere (original difficulty)
            difficultyFactor = 1.0;
        }
        
        // Calculate the safe zone based on difficulty
        const safeZoneHeight = (maxHeight - minHeight) * difficultyFactor;
        const safeZoneStart = minHeight + (maxHeight - minHeight - safeZoneHeight) / 2;
        
        let topHeight;
        
        // Check if we have a previous pipe to consider
        if (this.pipes.length > 0) {
            const lastPipe = this.pipes[this.pipes.length - 1];
            const lastPipeGap = lastPipe.bottomY - lastPipe.topHeight; // Get the actual gap of last pipe
            const lastPipeGapCenter = lastPipe.topHeight + (lastPipeGap / 2);
            
            // Maximum allowed change in gap center position
            const maxHeightChange = Math.min(120, safeZoneHeight * 0.6); // Increased to 60% of safe zone or 120px
            
            // Calculate new gap center within reasonable range of last pipe
            const minGapCenter = Math.max(safeZoneStart + finalGap / 2, lastPipeGapCenter - maxHeightChange);
            const maxGapCenter = Math.min(safeZoneStart + safeZoneHeight - finalGap / 2, lastPipeGapCenter + maxHeightChange);
            
            // Generate new gap center
            const newGapCenter = Math.random() * (maxGapCenter - minGapCenter) + minGapCenter;
            
            // Calculate top height from gap center
            topHeight = newGapCenter - (finalGap / 2);
        } else {
            // First pipe - can be anywhere in safe zone
            topHeight = Math.random() * safeZoneHeight + safeZoneStart;
        }
        
        // Ensure topHeight is within bounds
        topHeight = Math.max(minHeight, Math.min(maxHeight, topHeight));
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + finalGap,
            bottomHeight: this.canvas.height - (topHeight + finalGap) - 100,
            passed: false
        });
        
        this.lastPipeX = this.canvas.width;
    }
    
    updateGame() {
        if (this.gameState !== 'playing' && this.gameState !== 'ready') return;
        
        // Handle otterpilot
        if (this.otterpilot.active && (this.gameState === 'playing' || this.gameState === 'ready')) {
            this.handleOtterpilot();
        }
        
        // Update bird physics (only when playing, not when ready)
        if (this.gameState === 'playing') {
            this.bird.velocity += this.gravity;
            this.bird.y += this.bird.velocity;
            
            // Update bird rotation based on velocity
            this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);
        }
        
        // Update bird flap animation (always animate the flapping)
        this.bird.flapFrame++;
        
        // Update background scrolling (only when playing)
        if (this.gameState === 'playing') {
            this.backgroundOffset -= this.pipeSpeed * 0.25; // Background scrolls at 25% of pipe speed
            this.groundOffset -= this.pipeSpeed;
            
            if (this.groundOffset <= -50) {
                this.groundOffset = 0;
            }
        }
        
        // Update pipes (only when playing)
        if (this.gameState === 'playing') {
            for (let i = this.pipes.length - 1; i >= 0; i--) {
                const pipe = this.pipes[i];
                pipe.x -= this.pipeSpeed;
                
                // Check if bird passed through pipe
                if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                    pipe.passed = true;
                    this.score++;
                    this.scoreElement.textContent = this.score;
                    this.scoreElement.classList.add('score-animation');
                    setTimeout(() => {
                        this.scoreElement.classList.remove('score-animation');
                    }, 300);
                    this.playSound('score');
                    
                    // Update game speed based on new score
                    this.updateGameSpeed();
                    
                    // Decrease otterpilot counter when passing a pipe
                    if (this.otterpilot.active) {
                        this.otterpilot.pipesRemaining--;
                        if (this.otterpilot.pipesRemaining <= 0) {
                            this.otterpilot.active = false;
                            console.log('🧈 Otterpilot deactivated! Manual control restored! 🦦');
                        }
                    }
                }
                
                // Remove pipes that are off screen
                if (pipe.x + this.pipeWidth < 0) {
                    this.pipes.splice(i, 1);
                }
            }
            
            // Generate new pipes
            if (this.lastPipeX - this.pipeSpeed <= this.canvas.width - this.pipeSpacing) {
                this.generatePipe();
            }
            this.lastPipeX -= this.pipeSpeed;
            
            // Check collisions
            this.checkCollisions();
        }
    }
    
    handleOtterpilot() {
        // Find the next pipe that the otter needs to navigate
        let targetPipe = null;
        for (const pipe of this.pipes) {
            if (pipe.x + this.pipeWidth > this.bird.x) {
                targetPipe = pipe;
                break;
            }
        }
        
        // Emergency ceiling/ground avoidance (highest priority)
        if (this.bird.y <= 15) {
            // Too close to ceiling - don't flap, let gravity pull down
            return;
        }
        
        if (this.bird.y >= this.canvas.height - 115) {
            // Too close to ground - emergency flap
            this.bird.velocity = this.jumpStrength;
            this.bird.flapFrame = 0;
            this.playSound('flap');
            return;
        }
        
        if (targetPipe) {
            // Calculate the center of the gap
            const gapCenter = targetPipe.topHeight + (targetPipe.bottomY - targetPipe.topHeight) / 2;
            const birdCenter = this.bird.y + this.bird.height / 2;
            
            // Simple logic: if bird is below the gap center, flap to go up
            // Add a small buffer zone around the center to prevent oscillation
            const bufferZone = 15; // pixels of tolerance around center
            
            if (birdCenter > gapCenter + bufferZone) {
                // Bird is too low, flap to go up
                this.bird.velocity = this.jumpStrength;
                this.bird.flapFrame = 0;
                this.playSound('flap');
            }
            // If bird is above gapCenter - bufferZone, let gravity pull it down
            // This creates a stable zone around the gap center
            
        } else {
            // No pipe found - maintain middle height
            const targetHeight = this.canvas.height / 2;
            const birdCenter = this.bird.y + this.bird.height / 2;
            const bufferZone = 20;
            
            if (birdCenter > targetHeight + bufferZone) {
                this.bird.velocity = this.jumpStrength;
                this.bird.flapFrame = 0;
                this.playSound('flap');
            }
        }
    }
    
    checkCollisions() {
        // Ground collision (always active)
        if (this.bird.y + this.bird.height >= this.canvas.height - 100) {
            this.gameOver();
            return;
        }
        
        // Ceiling collision (always active)
        if (this.bird.y <= 0) {
            this.gameOver();
            return;
        }
        
        // Pipe collisions (skip if otterpilot is active)
        if (!this.otterpilot.active) {
            for (const pipe of this.pipes) {
                // Check if bird is in pipe's x range
                if (this.bird.x + this.bird.width > pipe.x && 
                    this.bird.x < pipe.x + this.pipeWidth) {
                    
                    // Check collision with top pipe
                    if (this.bird.y < pipe.topHeight) {
                        this.gameOver();
                        return;
                    }
                    
                    // Check collision with bottom pipe
                    if (this.bird.y + this.bird.height > pipe.bottomY) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.playSound('gameOver');
        
        // Add to leaderboard
        const playerRank = this.addToLeaderboard(this.playerName, this.score);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
        
        // Show player ranking
        this.showPlayerRanking(playerRank, this.leaderboard.length);
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('butteryOttersLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }

    saveLeaderboard() {
        localStorage.setItem('butteryOttersLeaderboard', JSON.stringify(this.leaderboard));
    }

    addToLeaderboard(name, score) {
        // Add new score
        this.leaderboard.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score (highest first)
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 scores
        this.leaderboard = this.leaderboard.slice(0, 100);
        
        // Save to localStorage
        this.saveLeaderboard();
        
        // Return player's rank (1-based)
        const playerRank = this.leaderboard.findIndex(entry => 
            entry.name === name && entry.score === score
        ) + 1;
        
        return playerRank;
    }

    showPlayerRanking(playerRank, totalPlayers) {
        let rankingHTML = `<h3>🎯 Your Ranking</h3>`;
        
        if (playerRank === 1) {
            rankingHTML += `<p>🏆 #1 - NEW HIGH SCORE! 🏆</p>`;
        } else if (playerRank <= 3) {
            rankingHTML += `<p>🥉 #${playerRank} - Top 3! Amazing! 🥉</p>`;
        } else if (playerRank <= 10) {
            rankingHTML += `<p>⭐ #${playerRank} - Top 10! Great job! ⭐</p>`;
        } else {
            rankingHTML += `<p>📊 Rank #${playerRank} out of ${totalPlayers} players</p>`;
        }
        
        this.rankingDisplay.innerHTML = rankingHTML;
    }

    showLeaderboard() {
        this.gameOverScreen.classList.add('hidden');
        this.leaderboardScreen.classList.remove('hidden');
        this.renderLeaderboard();
    }

    hideLeaderboard() {
        this.leaderboardScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
    }

    renderLeaderboard() {
        const leaderboardHTML = this.leaderboard.slice(0, 5).map((entry, index) => {
            const rank = index + 1;
            const isCurrentPlayer = entry.name === this.playerName && entry.score === this.score;
            const isTop3 = rank <= 3;
            
            let rankEmoji = '';
            if (rank === 1) rankEmoji = '🏆';
            else if (rank === 2) rankEmoji = '🥈';
            else if (rank === 3) rankEmoji = '🥉';
            else rankEmoji = `#${rank}`;
            
            return `
                <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''} ${isTop3 ? 'top-3' : ''}">
                    <span class="leaderboard-rank">${rankEmoji}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score}</span>
                </div>
            `;
        }).join('');
        
        this.leaderboardList.innerHTML = leaderboardHTML || '<p>No scores yet! Be the first!</p>';
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Simple clouds - fixed world positions
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Track total distance traveled for world positioning
        const totalDistanceTraveled = Math.abs(this.backgroundOffset * 2); // Convert background offset to world distance
        const cloudSpacing = 200; // Distance between potential cloud positions
        
        // Calculate which clouds should be visible
        const leftmostCloud = Math.floor((totalDistanceTraveled - 100) / cloudSpacing);
        const rightmostCloud = Math.ceil((totalDistanceTraveled + this.canvas.width + 100) / cloudSpacing);
        
        for (let i = leftmostCloud; i <= rightmostCloud; i++) {
            // Each cloud has a fixed world position
            const cloudWorldX = i * cloudSpacing;
            
            // Convert world position to screen position
            const cloudScreenX = cloudWorldX - totalDistanceTraveled;
            
            // Only draw clouds that are visible on screen
            if (cloudScreenX >= -100 && cloudScreenX <= this.canvas.width + 100) {
                // Use cloud index for consistent positioning
                const seed = Math.abs(i) * 7919; // Different seed than bubbles
                const pseudoRandom = (Math.sin(seed) + 1) / 2;
                
                // Only show cloud if pseudo-random value is above threshold
                if (pseudoRandom > 0.3) {
                    const cloudY = 50 + (pseudoRandom * 60); // Vary cloud height
                    this.drawCloud(cloudScreenX, cloudY);
                }
            }
        }
        
        // Ground - butter pool
        const groundHeight = 100;
        const groundY = this.canvas.height - groundHeight;
        
        // Main butter pool color
        const butterPoolGradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        butterPoolGradient.addColorStop(0, '#FFE135');  // Bright butter yellow at top
        butterPoolGradient.addColorStop(0.3, '#FFD700'); // Golden middle
        butterPoolGradient.addColorStop(0.7, '#FFA500'); // Deeper orange
        butterPoolGradient.addColorStop(1, '#FF8C00');   // Dark orange at bottom
        
        this.ctx.fillStyle = butterPoolGradient;
        this.ctx.fillRect(0, groundY, this.canvas.width, groundHeight);
        
        // Butter surface ripples/waves
        this.ctx.strokeStyle = '#FFEB9C';
        this.ctx.lineWidth = 2;
        
        // Create wavy surface lines
        for (let wave = 0; wave < 3; wave++) {
            this.ctx.beginPath();
            const waveY = groundY + 10 + (wave * 8);
            const waveOffset = (this.groundOffset * 0.5 + wave * 50) % (this.canvas.width + 100);
            
            for (let x = -50; x < this.canvas.width + 50; x += 20) {
                const y = waveY + Math.sin((x + waveOffset) * 0.02) * 3;
                if (x === -50) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        // Add butter surface highlights
        const surfaceHighlight = this.ctx.createLinearGradient(0, groundY, 0, groundY + 20);
        surfaceHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        surfaceHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = surfaceHighlight;
        this.ctx.fillRect(0, groundY, this.canvas.width, 20);
        
        // Add some butter bubbles/texture spots
        this.ctx.fillStyle = 'rgba(255, 235, 156, 0.6)';
        
        // Generate bubbles based on world position - they stay fixed as player moves
        const bubbleWorldDistance = Math.abs(this.backgroundOffset * 2); // Same as clouds for consistency
        const bubbleSpacing = 120; // Distance between potential bubble positions
        
        // Calculate which bubbles should be visible on screen
        const leftmostBubble = Math.floor((bubbleWorldDistance - 50) / bubbleSpacing);
        const rightmostBubble = Math.ceil((bubbleWorldDistance + this.canvas.width + 50) / bubbleSpacing);
        
        for (let i = leftmostBubble; i <= rightmostBubble; i++) {
            // Each bubble has a fixed world position
            const bubbleWorldX = i * bubbleSpacing;
            
            // Convert world position to screen position
            const bubbleScreenX = bubbleWorldX - bubbleWorldDistance;
            
            // Only draw bubbles that are visible on screen
            if (bubbleScreenX >= -20 && bubbleScreenX <= this.canvas.width + 20) {
                // Use the bubble index as a seed for consistent randomness
                const seed = Math.abs(i) * 12345; // Simple pseudo-random seed
                const pseudoRandom1 = (Math.sin(seed) + 1) / 2;
                const pseudoRandom2 = (Math.sin(seed * 1.1) + 1) / 2;
                const pseudoRandom3 = (Math.sin(seed * 0.7) + 1) / 2;
                
                // Only show bubble if pseudo-random value is above threshold
                if (pseudoRandom1 > 0.4) {
                    const bubbleX = bubbleScreenX + (pseudoRandom2 - 0.5) * 30; // Add horizontal variation
                    const bubbleY = groundY + 25 + pseudoRandom3 * 40; // Vary vertical position
                    const bubbleSize = 2 + pseudoRandom1 * 4; // Vary size
                    
                    this.ctx.beginPath();
                    this.ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Butter pool edge/border
        this.ctx.strokeStyle = '#CC9900';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.canvas.width, groundY);
        this.ctx.stroke();
    }
    
    drawCloud(x, y) {
        // Whipped butter color - creamy yellow
        this.ctx.fillStyle = '#FFF8DC';
        
        // Main cloud body with multiple overlapping circles for whipped texture
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add whipped butter highlights
        this.ctx.fillStyle = '#FFFACD';
        this.ctx.beginPath();
        this.ctx.arc(x + 5, y - 5, 8, 0, Math.PI * 2);
        this.ctx.arc(x + 20, y - 8, 10, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y + 2, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add butter texture peaks (like whipped butter peaks)
        this.ctx.fillStyle = '#FFE135';
        
        // Small butter peaks
        for (let i = 0; i < 6; i++) {
            const peakX = x + (i * 6) + 3;
            const peakY = y - 12 + Math.sin(i) * 3;
            const peakSize = 2 + Math.sin(i * 0.5) * 1;
            
            this.ctx.beginPath();
            this.ctx.arc(peakX, peakY, peakSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add some butter swirl lines
        this.ctx.strokeStyle = '#F0E68C';
        this.ctx.lineWidth = 1;
        
        // Curved swirl lines to simulate whipped texture
        this.ctx.beginPath();
        this.ctx.arc(x + 10, y - 2, 8, 0.5, Math.PI + 0.5, false);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(x + 20, y + 3, 6, Math.PI, Math.PI * 2, false);
        this.ctx.stroke();
        
        // Subtle shadow/depth
        this.ctx.fillStyle = 'rgba(218, 165, 32, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y + 8, 12, 0, Math.PI * 2);
        this.ctx.arc(x + 18, y + 8, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 28, y + 8, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBird() {
        this.ctx.save();
        
        // Move to otter position
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        
        // Rotate otter based on velocity (less rotation than bird)
        this.ctx.rotate(this.bird.rotation * Math.PI / 180 * 0.3);
        
        // Otter body (brown oval)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Otter body outline
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        // Otter belly (lighter brown)
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.beginPath();
        this.ctx.ellipse(2, 2, this.bird.width / 3, this.bird.height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Otter head (slightly larger circle)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(-2, -8, this.bird.width / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        // Otter ears (small rounded triangles)
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.arc(-8, -15, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(4, -15, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner ears (pink)
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.arc(-8, -15, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(4, -15, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes (large and cute)
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(-5, -10, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(1, -10, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupils
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(-4, -9, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(2, -9, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye shine (makes it look more alive)
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(-3.5, -9.5, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(2.5, -9.5, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Nose (small black triangle)
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.moveTo(-2, -5);
        this.ctx.lineTo(-4, -3);
        this.ctx.lineTo(0, -3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Mouth (small curve)
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(-2, -2, 2, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        
        // Whiskers
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.8;
        
        // Left whiskers
        this.ctx.beginPath();
        this.ctx.moveTo(-8, -6);
        this.ctx.lineTo(-12, -7);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-8, -4);
        this.ctx.lineTo(-12, -4);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-8, -2);
        this.ctx.lineTo(-12, -1);
        this.ctx.stroke();
        
        // Right whiskers
        this.ctx.beginPath();
        this.ctx.moveTo(4, -6);
        this.ctx.lineTo(8, -7);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(4, -4);
        this.ctx.lineTo(8, -4);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(4, -2);
        this.ctx.lineTo(8, -1);
        this.ctx.stroke();
        
        // Paws (animated with flapping)
        const pawOffset = Math.sin(this.bird.flapFrame * 0.3) * 3;
        this.ctx.fillStyle = '#654321';
        
        // Front paws
        this.ctx.beginPath();
        this.ctx.arc(-8, 5 + pawOffset, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(6, 5 - pawOffset, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tail (behind the body)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(8, 3, 6, 3, Math.PI / 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawPipes() {
        for (const pipe of this.pipes) {
            // Draw top butter stick
            this.drawButterStick(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Draw bottom butter stick
            this.drawButterStick(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
        }
    }
    
    drawButterStick(x, y, width, height) {
        // Add slight variation to corner radius for each stick
        const baseRadius = 8;
        const variation = (x + y) % 6 - 3; // Creates variation between -3 and +2
        const cornerRadius = Math.max(3, baseRadius + variation);
        
        // Create rounded rectangle path
        this.ctx.beginPath();
        this.ctx.moveTo(x + cornerRadius, y);
        this.ctx.lineTo(x + width - cornerRadius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        this.ctx.lineTo(x + width, y + height - cornerRadius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        this.ctx.lineTo(x + cornerRadius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        this.ctx.lineTo(x, y + cornerRadius);
        this.ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        this.ctx.closePath();
        
        // Main butter color - creamy yellow like real butter
        const butterGradient = this.ctx.createLinearGradient(x, y, x + width, y);
        butterGradient.addColorStop(0, '#FFEB9C');  // Light butter yellow
        butterGradient.addColorStop(0.3, '#FFE135'); // Main butter color
        butterGradient.addColorStop(0.7, '#FFE135'); // Main butter color
        butterGradient.addColorStop(1, '#E6CC00');   // Slightly darker edge
        
        this.ctx.fillStyle = butterGradient;
        this.ctx.fill();
        
        // Clip to the rounded rectangle for all subsequent drawing
        this.ctx.save();
        this.ctx.clip();
        
        // Add 3D effect - left highlight (light source from left)
        const highlightGradient = this.ctx.createLinearGradient(x, y, x + width * 0.3, y);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(x, y, width * 0.3, height);
        
        // Add 3D effect - right shadow
        const shadowGradient = this.ctx.createLinearGradient(x + width * 0.7, y, x + width, y);
        shadowGradient.addColorStop(0, 'rgba(204, 153, 0, 0)');
        shadowGradient.addColorStop(1, 'rgba(204, 153, 0, 0.3)');
        this.ctx.fillStyle = shadowGradient;
        this.ctx.fillRect(x + width * 0.7, y, width * 0.3, height);
        
        // Add subtle top highlight
        const topHighlight = this.ctx.createLinearGradient(x, y, x, y + height * 0.2);
        topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = topHighlight;
        this.ctx.fillRect(x, y, width, height * 0.2);
        
        // Add subtle bottom shadow
        const bottomShadow = this.ctx.createLinearGradient(x, y + height * 0.8, x, y + height);
        bottomShadow.addColorStop(0, 'rgba(204, 153, 0, 0)');
        bottomShadow.addColorStop(1, 'rgba(204, 153, 0, 0.2)');
        this.ctx.fillStyle = bottomShadow;
        this.ctx.fillRect(x, y + height * 0.8, width, height * 0.2);
        
        this.ctx.restore();
        
        // Draw the rounded border
        this.ctx.beginPath();
        this.ctx.moveTo(x + cornerRadius, y);
        this.ctx.lineTo(x + width - cornerRadius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        this.ctx.lineTo(x + width, y + height - cornerRadius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        this.ctx.lineTo(x + cornerRadius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        this.ctx.lineTo(x, y + cornerRadius);
        this.ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        this.ctx.closePath();
        
        this.ctx.strokeStyle = '#CC9900';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawScore() {
        if (this.gameState === 'playing' || this.gameState === 'ready') {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 36px Courier New';
            this.ctx.textAlign = 'center';
            
            const text = this.score.toString();
            this.ctx.strokeText(text, this.canvas.width / 2, 60);
            this.ctx.fillText(text, this.canvas.width / 2, 60);
            
            // Show speed multiplier when above 1x
            const currentMultiplier = this.pipeSpeed / this.basePipeSpeed;
            if (currentMultiplier > 1.05) { // Only show when noticeably faster
                this.ctx.fillStyle = '#FF6B6B';
                this.ctx.strokeStyle = '#8B0000';
                this.ctx.lineWidth = 2;
                this.ctx.font = 'bold 18px Courier New';
                this.ctx.textAlign = 'center';
                
                const speedText = `🚀 ${currentMultiplier.toFixed(1)}x SPEED`;
                this.ctx.strokeText(speedText, this.canvas.width / 2, 85);
                this.ctx.fillText(speedText, this.canvas.width / 2, 85);
            }
            
            // Show otterpilot indicator
            if (this.otterpilot.active) {
                this.ctx.fillStyle = '#FFE135';
                this.ctx.strokeStyle = '#CC9900';
                this.ctx.lineWidth = 2;
                this.ctx.font = 'bold 20px Courier New';
                this.ctx.textAlign = 'center';
                
                const otterpilotText = `🧈 OTTERPILOT: ${this.otterpilot.pipesRemaining} left 🦦`;
                const yPosition = currentMultiplier > 1.05 ? 110 : 90; // Adjust position if speed indicator is shown
                this.ctx.strokeText(otterpilotText, this.canvas.width / 2, yPosition);
                this.ctx.fillText(otterpilotText, this.canvas.width / 2, yPosition);
                
                // Show invincibility indicator
                this.ctx.fillStyle = '#00FF00';
                this.ctx.strokeStyle = '#008000';
                this.ctx.lineWidth = 2;
                this.ctx.font = 'bold 16px Courier New';
                this.ctx.textAlign = 'center';
                
                const invincibleText = `🛡️ INVINCIBLE TO BUTTER 🛡️`;
                const invincibleY = yPosition + 25;
                this.ctx.strokeText(invincibleText, this.canvas.width / 2, invincibleY);
                this.ctx.fillText(invincibleText, this.canvas.width / 2, invincibleY);
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game elements
        this.drawBackground();
        this.drawPipes();
        this.drawBird();
        this.drawScore();
    }
    
    gameLoop() {
        this.updateGame();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    playSound(soundName) {
        try {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {
                    // Ignore audio play errors (common on mobile)
                    console.log('Audio play failed:', e);
                });
            }
        } catch (error) {
            console.log('Audio error:', error);
        }
    }
    
    updateGameSpeed() {
        // Progressive speed increase based on score
        // Speed increases every 10 points, but caps at reasonable levels
        const speedMultiplier = 1 + (Math.floor(this.score / 10) * 0.03); // 3% increase every 10 points (reduced from 5% every 5 points)
        const maxSpeedMultiplier = 1.8; // Cap at 1.8x speed to keep it more playable (reduced from 2.0x)
        
        const finalMultiplier = Math.min(speedMultiplier, maxSpeedMultiplier);
        
        // Update dynamic values
        this.pipeSpeed = this.basePipeSpeed * finalMultiplier;
        this.gravity = this.baseGravity * finalMultiplier;
        this.jumpStrength = this.baseJumpStrength * finalMultiplier;
        
        // Debug info (only log when speed actually changes)
        if (this.score % 10 === 0 && this.score > 0) {
            console.log(`🚀 Speed increased! Score: ${this.score}, Multiplier: ${finalMultiplier.toFixed(1)}x`);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBirdGame();
});

// Prevent scrolling on mobile
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Handle window resize
window.addEventListener('resize', () => {
    // The canvas will automatically scale with CSS
    // No need to resize the canvas element itself
}); 
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
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
        
        // Game settings
        this.gravity = 0.14;
        this.jumpStrength = -2.5;
        this.pipeSpeed = 2;
        this.pipeGap = 150;
        this.pipeWidth = 60;
        
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
        
        // Mouse and touch controls
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.flap();
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.flap();
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.flap();
                } else if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restartGame();
                }
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.gameOverScreen.classList.add('hidden');
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
        
        // Reset background
        this.backgroundOffset = 0;
        this.groundOffset = 0;
        
        // Generate first pipe
        setTimeout(() => {
            this.generatePipe();
        }, 1000);
    }
    
    flap() {
        this.bird.velocity = this.jumpStrength;
        this.bird.flapFrame = 0;
        this.playSound('flap');
    }
    
    generatePipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight - 100; // 100 for ground
        
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
        
        const topHeight = Math.random() * safeZoneHeight + safeZoneStart;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            bottomHeight: this.canvas.height - (topHeight + this.pipeGap) - 100,
            passed: false
        });
        
        this.lastPipeX = this.canvas.width;
    }
    
    updateGame() {
        if (this.gameState !== 'playing') return;
        
        // Update bird physics
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);
        
        // Update bird flap animation
        this.bird.flapFrame++;
        
        // Update background scrolling
        this.backgroundOffset -= 0.5;
        this.groundOffset -= this.pipeSpeed;
        
        if (this.groundOffset <= -50) {
            this.groundOffset = 0;
        }
        
        // Update pipes
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
    
    checkCollisions() {
        // Ground collision
        if (this.bird.y + this.bird.height >= this.canvas.height - 100) {
            this.gameOver();
            return;
        }
        
        // Ceiling collision
        if (this.bird.y <= 0) {
            this.gameOver();
            return;
        }
        
        // Pipe collisions
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
    
    gameOver() {
        this.gameState = 'gameOver';
        this.playSound('gameOver');
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Simple clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const x = (i * 150 + this.backgroundOffset) % (this.canvas.width + 100);
            this.drawCloud(x, 50 + i * 30);
        }
        
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // Ground pattern
        this.ctx.fillStyle = '#A0522D';
        for (let x = this.groundOffset; x < this.canvas.width; x += 50) {
            this.ctx.fillRect(x, this.canvas.height - 100, 25, 100);
        }
        
        // Grass
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 20);
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBird() {
        this.ctx.save();
        
        // Move to bird position
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        
        // Rotate bird based on velocity
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);
        
        // Bird body (yellow circle)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird outline
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Wing (animated)
        const wingOffset = Math.sin(this.bird.flapFrame * 0.5) * 5;
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, wingOffset, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(5, -5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(6, -4, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.width / 2 - 5, 0);
        this.ctx.lineTo(this.bird.width / 2 + 5, -2);
        this.ctx.lineTo(this.bird.width / 2 + 5, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawPipes() {
        for (const pipe of this.pipes) {
            // Pipe gradient
            const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
            gradient.addColorStop(0, '#228B22');
            gradient.addColorStop(0.5, '#32CD32');
            gradient.addColorStop(1, '#228B22');
            
            this.ctx.fillStyle = gradient;
            
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Top pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            
            // Bottom pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
            
            // Pipe outlines
            this.ctx.strokeStyle = '#006400';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            this.ctx.strokeRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
        }
    }
    
    drawScore() {
        if (this.gameState === 'playing') {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 36px Courier New';
            this.ctx.textAlign = 'center';
            
            const text = this.score.toString();
            this.ctx.strokeText(text, this.canvas.width / 2, 60);
            this.ctx.fillText(text, this.canvas.width / 2, 60);
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
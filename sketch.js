// Ensure audio context is started on user interaction
window.addEventListener('click', function() {
    if (typeof getAudioContext === 'function') {
        getAudioContext().resume();
    }
});

// Global variables
let player;
let enemies = [];
let bullets = [];
let stars = [];
let score = 0;
let gameOver = false;
let lastShotTime = 0;
let neuralPatterns = []; // For background effect

// Leaderboard variables
let leaderboard = [];
let showEmailInput = false;
let emailInput = '';
let isSubmittingScore = false;
let submitMessage = '';
let submitMessageTimer = 0;

// Sound variables
let soundEnabled = false;
let laserOsc;
let explosionOsc;
let thrusterOsc;  // Thruster sound
let rotationOsc;  // Rotation sound
let brakeOsc;     // Brake sound
let gameOverOsc;

function setup() {
    createCanvas(1000, 600); // Increased width to accommodate leaderboard
    initializeGame();
    setupSound();
    fetchLeaderboard();
}

function setupSound() {
    try {
        getAudioContext().resume();
        soundEnabled = true;
        
        // Laser sound oscillator
        laserOsc = new p5.Oscillator('square');
        laserOsc.amp(0);
        
        // Explosion sound
        explosionOsc = new p5.Noise();
        explosionOsc.amp(0);
        
        // Thruster sound
        thrusterOsc = new p5.Oscillator('square');
        thrusterOsc.freq(200);
        thrusterOsc.amp(0);
        
        // Rotation sound
        rotationOsc = new p5.Oscillator('sawtooth');
        rotationOsc.amp(0);
        
        // Brake sound
        brakeOsc = new p5.Oscillator('triangle');
        brakeOsc.amp(0);
        
        // Game over sound
        gameOverOsc = new p5.Oscillator('square');
        gameOverOsc.amp(0);
        
        // Start all oscillators if sound is enabled
        if (soundEnabled) {
            laserOsc.start();
            explosionOsc.start();
            thrusterOsc.start();
            rotationOsc.start();
            brakeOsc.start();
            gameOverOsc.start();
        }
    } catch (e) {
        console.log('Sound system not available:', e);
    }
}

// Play laser sound
function playLaserSound() {
    if (soundEnabled && laserOsc) {
        laserOsc.start();
        laserOsc.freq(880);
        laserOsc.amp(0.1, 0);
        laserOsc.amp(0, 0.1);
        setTimeout(() => laserOsc.stop(), 100);
    }
}

// Play explosion sound
function playExplosionSound() {
    if (soundEnabled && explosionOsc) {
        explosionOsc.start();
        explosionOsc.amp(0.3, 0);
        explosionOsc.amp(0, 0.2);
        setTimeout(() => explosionOsc.stop(), 200);
    }
}

// Update engine sounds based on movement
function updateEngineSound() {
    if (soundEnabled) {
        // Thruster sound (Up Arrow) with frequency modulation
        if (keyIsDown(UP_ARROW)) {
            let baseFreq = 200;
            let modulation = 20 * sin(millis() * 0.01);
            thrusterOsc.freq(baseFreq + modulation);
            thrusterOsc.amp(0.05, 0.1);
        } else {
            thrusterOsc.amp(0, 0.1);
        }
        
        // Rotation sound (Left or Right Arrow)
        if (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW)) {
            rotationOsc.freq(400);
            rotationOsc.amp(0.03, 0.1);
        } else {
            rotationOsc.amp(0, 0.1);
        }
        
        // Brake sound (Down Arrow)
        if (keyIsDown(DOWN_ARROW)) {
            brakeOsc.freq(300);
            brakeOsc.amp(0.04, 0.1);
        } else {
            brakeOsc.amp(0, 0.1);
        }
    }
}

// Play game over sound sequence
function playGameOverSound() {
    if (soundEnabled && gameOverOsc) {
        gameOverOsc.start();
        const sequence = [
            { freq: 440, duration: 100 },
            { freq: 349.23, duration: 100 },
            { freq: 293.66, duration: 100 },
            { freq: 261.63, duration: 300 },
            { freq: 207.65, duration: 400 }
        ];
        let totalDelay = 0;
        sequence.forEach(({ freq, duration }) => {
            setTimeout(() => {
                gameOverOsc.freq(freq);
                gameOverOsc.amp(0.2);
                setTimeout(() => gameOverOsc.amp(0, 0.1), duration - 50);
            }, totalDelay);
            totalDelay += duration;
        });
        setTimeout(() => gameOverOsc.stop(), totalDelay + 100);
    }
}

// Stop all sounds
function stopAllSounds() {
    if (laserOsc) laserOsc.stop();
    if (explosionOsc) explosionOsc.stop();
    if (thrusterOsc) thrusterOsc.stop();
    if (rotationOsc) rotationOsc.stop();
    if (brakeOsc) brakeOsc.stop();
    if (gameOverOsc) gameOverOsc.stop();
}

function initializeGame() {
    player = new Player(width / 2, height / 2, 20);
    enemies = [];
    bullets = [];
    score = 0;
    gameOver = false;
    
    // Generate neural network background patterns
    neuralPatterns = [];
    for (let i = 0; i < 20; i++) {
        neuralPatterns.push({
            x: random(width),
            y: random(height),
            connections: []
        });
        for (let j = 0; j < 3; j++) {
            neuralPatterns[i].connections.push({
                x: neuralPatterns[i].x + random(-100, 100),
                y: neuralPatterns[i].y + random(-100, 100),
                alpha: random(50, 150)
            });
        }
    }
    
    // Generate stars
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({ x: random(width), y: random(height), size: random(1, 3) });
    }
}

// Fetch leaderboard data from our API
function fetchLeaderboard() {
    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? 'http://localhost:3000/api/leaderboard' 
        : window.location.origin + '/api/leaderboard';
        
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            leaderboard = data;
            console.log('Leaderboard data loaded:', data);
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
        });
}

// Submit score to the leaderboard
function submitScore(email, score) {
    isSubmittingScore = true;
    
    const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? 'http://localhost:3000/api/submit-score' 
        : window.location.origin + '/api/submit-score';
        
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, score }),
    })
        .then(response => response.json())
        .then(data => {
            isSubmittingScore = false;
            submitMessage = data.message || 'Score submitted!';
            submitMessageTimer = 120; // Show message for 2 seconds
            fetchLeaderboard(); // Refresh leaderboard
        })
        .catch(error => {
            console.error('Error submitting score:', error);
            isSubmittingScore = false;
            submitMessage = 'Error submitting score';
            submitMessageTimer = 120;
        });
}

// Add this function to check if email is valid
function isValidEmail(email) {
    // Simple email validation - must contain @ and at least one dot after @
    return email.includes('@') && email.indexOf('.', email.indexOf('@')) > email.indexOf('@');
}

function draw() {
    background(0);
    
    // Draw neural network background
    stroke(0, 150, 255, 30);
    strokeWeight(1);
    for (let pattern of neuralPatterns) {
        for (let conn of pattern.connections) {
            stroke(0, 150, 255, conn.alpha);
            line(pattern.x, pattern.y, conn.x, conn.y);
            noFill();
            ellipse(conn.x, conn.y, 4, 4);
        }
        fill(0, 150, 255, 100);
        ellipse(pattern.x, pattern.y, 6, 6);
    }
    // Draw starry background
    fill(255);
    noStroke();
    for (let star of stars) {
        ellipse(star.x, star.y, star.size);
    }

    if (!gameOver) {
        // Update game objects
        player.update();
        updateEngineSound();  // Update sounds every frame
        for (let enemy of enemies) {
            enemy.update();
        }
        for (let bullet of bullets) {
            bullet.update();
        }

        // Spawn enemies every 60 frames
        if (frameCount % 60 === 0) {
            let ex = random(width);
            let ey = 0;
            let evx = random(-1, 1);
            let evy = 2;
            let er = 10;
            enemies.push(new Enemy(ex, ey, evx, evy, er));
        }

        // Fire bullet with cooldown
        if (keyIsDown(32) && millis() - lastShotTime > 200) {
            let bx = player.x - sin(player.angle) * (player.size / 2);
            let by = player.y - cos(player.angle) * (player.size / 2);
            let bvx = -sin(player.angle) * 5;
            let bvy = -cos(player.angle) * 5;
            bullets.push(new Bullet(bx, by, bvx, bvy));
            lastShotTime = millis();
            playLaserSound();
        }

        // Check collisions
        for (let bullet of bullets) {
            for (let enemy of enemies) {
                if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.radius + enemy.radius) {
                    bullet.isAlive = false;
                    enemy.isAlive = false;
                    score += 1;
                    playExplosionSound();
                }
            }
        }

        for (let enemy of enemies) {
            if (dist(player.x, player.y, enemy.x, enemy.y) < player.radius + enemy.radius) {
                gameOver = true;
                showEmailInput = true; // Automatically show email input
                emailInput = '';
                stopAllSounds();
                playGameOverSound();
                break;
            }
        }

        // Remove dead bullets and enemies
        bullets = bullets.filter(b => b.isAlive);
        enemies = enemies.filter(e => e.isAlive);

        // Draw game objects
        player.draw();
        for (let enemy of enemies) {
            enemy.draw();
        }
        for (let bullet of bullets) {
            bullet.draw();
        }

        // Display score
        drawScore();
        
        // Draw leaderboard on the right side
        drawLeaderboard();
    } else {
        drawGameOver();
    }
    
    // Show submit message if needed
    if (submitMessageTimer > 0) {
        fill(255);
        textAlign(CENTER);
        textSize(20);
        text(submitMessage, width/2, height - 50);
        submitMessageTimer--;
    }
}

// Player class for the spaceship
class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.size = size;
        this.radius = size / 2;
        this.rotationSpeed = 0.1;
        this.acceleration = 0.3;
        this.friction = 0.98;
        this.maxSpeed = 7;
    }

    update() {
        if (keyIsDown(LEFT_ARROW)) {
            this.angle -= this.rotationSpeed;
        }
        if (keyIsDown(RIGHT_ARROW)) {
            this.angle += this.rotationSpeed;
        }
        if (keyIsDown(UP_ARROW)) {
            this.vx += this.acceleration * (-sin(this.angle));
            this.vy += this.acceleration * (-cos(this.angle));
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
        this.vx *= this.friction;
        this.vy *= this.friction;
        let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
    }

    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        fill(255);
        stroke(100, 200, 255);
        strokeWeight(2);
        triangle(-this.size / 2, this.size / 2, this.size / 2, this.size / 2, 0, -this.size / 2);
        if (keyIsDown(UP_ARROW)) {
            noStroke();
            fill(255, 100, 0);
            triangle(-this.size / 4, this.size / 2, this.size / 4, this.size / 2, 0, this.size / 2 + random(this.size / 2, this.size));
            fill(255, 50, 0);
            triangle(-this.size / 4, this.size / 2, -this.size / 3, this.size / 2, -this.size / 4, this.size / 2 + random(this.size / 4));
            triangle(this.size / 4, this.size / 2, this.size / 3, this.size / 2, this.size / 4, this.size / 2 + random(this.size / 4));
        }
        pop();
    }
}

// Enemy class for AI ships
class Enemy {
    constructor(x, y, vx, vy, radius) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.isAlive = true;
        this.angle = random(TWO_PI);
        this.rotationSpeed = random(-0.02, 0.02);
        this.type = floor(random(3));
        this.pulsePhase = random(TWO_PI);
        this.glowIntensity = random(150, 255);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;
        this.pulsePhase += 0.1;
        if (this.y > height) {
            this.isAlive = false;
        }
    }

    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        let glowSize = this.radius * 2 + sin(this.pulsePhase) * 5;
        let glowAlpha = map(sin(this.pulsePhase), -1, 1, 50, 150);
        noStroke();
        for (let i = 3; i > 0; i--) {
            fill(0, 150, 255, glowAlpha / (i * 2));
            ellipse(0, 0, glowSize + i * 10);
        }
        switch(this.type) {
            case 0:
                stroke(0, 200, 255);
                strokeWeight(2);
                fill(0, 50, 100);
                beginShape();
                for (let i = 0; i < 6; i++) {
                    let angle = i * TWO_PI / 6;
                    vertex(cos(angle) * this.radius, sin(angle) * this.radius);
                }
                endShape(CLOSE);
                stroke(0, 255, 255, this.glowIntensity);
                line(-this.radius/2, 0, this.radius/2, 0);
                line(0, -this.radius/2, 0, this.radius/2);
                break;
            case 1:
                stroke(255, 100, 200);
                strokeWeight(2);
                fill(100, 0, 100);
                ellipse(0, 0, this.radius * 2);
                for (let i = 0; i < 4; i++) {
                    let angle = i * TWO_PI / 4;
                    stroke(255, 100, 200, this.glowIntensity);
                    line(cos(angle) * this.radius * 0.5, sin(angle) * this.radius * 0.5,
                        cos(angle) * this.radius, sin(angle) * this.radius);
                }
                break;
            case 2:
                stroke(200, 255, 0);
                strokeWeight(2);
                fill(50, 100, 0);
                for (let i = 0; i < 3; i++) {
                    rotate(TWO_PI / 3);
                    rect(-this.radius * 0.4, -this.radius * 0.4, 
                        this.radius * 0.8, this.radius * 0.8);
                }
                fill(200, 255, 0, this.glowIntensity);
                ellipse(0, 0, this.radius * 0.8);
                break;
        }
        pop();
    }
}

// Bullet class
class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 2;
        this.isAlive = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.isAlive = false;
        }
    }

    draw() {
        fill(255);
        ellipse(this.x, this.y, this.radius * 2);
    }
}

// Draw score
function drawScore() {
    fill(0, 150, 255);
    noStroke();
    rect(10, 10, 180, 30, 5);  // Increased width from 150 to 200
    fill(255);
    textSize(16);
    textAlign(LEFT, CENTER);
    text("NEURAL SCORE: " + score, 20, 25);
}

// Draw leaderboard
function drawLeaderboard() {
    // Draw leaderboard background
    fill(0, 50, 100, 150);
    rect(800, 0, 200, height);
    
    // Draw leaderboard title
    fill(0, 200, 255);
    textSize(20);
    textAlign(CENTER);
    text("LEADERBOARD", 900, 30);
    
    // Draw leaderboard entries
    fill(255);
    textSize(16);
    textAlign(LEFT);
    for (let i = 0; i < leaderboard.length && i < 10; i++) {
        let entry = leaderboard[i];
        // Only show the part before @ symbol
        let displayEmail = entry.email.split('@')[0];
        if (displayEmail.length > 12) {
            displayEmail = displayEmail.substring(0, 9) + '...';
        }
        text(`${i+1}. ${displayEmail}`, 820, 70 + i * 30);
        textAlign(RIGHT);
        text(entry.score, 980, 70 + i * 30);
        textAlign(LEFT);
    }
}

// Draw game over screen
function drawGameOver() {
    background(0);
    push();
    textAlign(CENTER, CENTER);
    textSize(72);
    textStyle(BOLD);
    for(let i = -2; i <= 2; i++) {
        for(let j = -2; j <= 2; j++) {
            if(i !== 0 || j !== 0) {
                fill(255, 0, 0);
                text("GAME OVER", width/2, height/2 - 40 + j);
            }
        }
    }
    fill(255, 255, 0);
    text("GAME OVER", width/2, height/2 - 40);
    pop();
    textSize(24);
    fill(255);
    text("FINAL SCORE: " + score, width/2, height/2 + 40);
    
    // Email input for leaderboard
    if (showEmailInput) {
        // Draw input box background
        fill(0, 50, 100);
        rect(width/2 - 150, height/2 + 80, 300, 40, 5);
        
        // Draw input box border
        strokeWeight(2);
        stroke(0, 150, 255);
        noFill();
        rect(width/2 - 150, height/2 + 80, 300, 40, 5);
        
        // Draw email text with cursor
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        noStroke();
        text(emailInput + (frameCount % 60 < 30 ? "" : ""), width/2, height/2 + 100);
        
        // Show validation status
        if (emailInput.length > 0) {
            if (isValidEmail(emailInput)) {
                fill(0, 255, 0);
                text("✓", width/2 + 160, height/2 + 100);
            } else {
                fill(255, 0, 0);
                text("✗", width/2 + 160, height/2 + 100);
            }
        }
        
        // Instructions
        textSize(14);
        fill(0, 200, 255);
        text("Enter your email and press ENTER", width/2, height/2 + 140);
        text("Press ESC to cancel", width/2, height/2 + 160);
        
        if (isSubmittingScore) {
            fill(255);
            textSize(16);
            text("Submitting score...", width/2, height/2 + 190);
        } else if (submitMessage && submitMessageTimer > 0) {
            fill(submitMessage.includes('Error') ? '#ff5555' : '#55ff55');
            textSize(16);
            text(submitMessage, width/2, height/2 + 190);
            submitMessageTimer--;
        }
    } else {
        if (frameCount % 60 < 30) {
            textSize(20);
            fill(255);
            text("PRESS SPACE TO CONTINUE", width/2, height/2 + 80);
            text("PRESS E TO SUBMIT SCORE", width/2, height/2 + 110);
        }
    }
    
    for (let y = 0; y < height; y += 4) {
        stroke(0, 0, 0, 50);
        line(0, y, width, y);
    }
    
    // Draw leaderboard
    drawLeaderboard();
}

// Modify keyPressed function
function keyPressed() {
    if (gameOver) {
        if (keyCode === 32 && !showEmailInput) {
            // Space to restart
            initializeGame();
        } else if (keyCode === 69 && !showEmailInput) {
            // 'E' to enter email
            showEmailInput = true;
            emailInput = '';
        } else if (showEmailInput) {
            if (keyCode === ENTER && isValidEmail(emailInput)) {
                // Submit score
                submitScore(emailInput, score);
                showEmailInput = false;
            } else if (keyCode === ESCAPE) {
                // Cancel email input
                showEmailInput = false;
            } else if (keyCode === BACKSPACE) {
                // Handle backspace
                emailInput = emailInput.slice(0, -1);
            }
            // We'll handle character input in keyTyped instead
        }
    }
}

// Add keyTyped function for better character handling
function keyTyped() {
    if (gameOver && showEmailInput && emailInput.length < 30) {
        // This captures the actual typed character including dots
        if (key.length === 1) {
            emailInput += key;
        }
        return false; // Prevent default behavior
    }
    return true;
}
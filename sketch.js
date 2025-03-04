// Global variables
let player;
let enemies = [];
let bullets = [];
let stars = [];
let score = 0;
let gameOver = false;
let lastShotTime = 0;
let neuralPatterns = []; // For background effect

// Sound variables
let soundEnabled = false;
let laserOsc;
let explosionOsc;
let thrusterOsc;  // Simple thruster sound
let gameOverOsc;
let powerUpSound;

function setup() {
  createCanvas(800, 600);
  initializeGame();
  setupSound();
}

function setupSound() {
  try {
    getAudioContext().resume();
    soundEnabled = true;
    
    // Create laser sound oscillator
    laserOsc = new p5.Oscillator('square');
    laserOsc.amp(0);
    
    // Create explosion sound
    explosionOsc = new p5.Noise();
    explosionOsc.amp(0);
    
    // Create simple thruster sound
    thrusterOsc = new p5.Oscillator('square');
    thrusterOsc.freq(200);
    thrusterOsc.amp(0);
    
    // Create game over sound
    gameOverOsc = new p5.Oscillator('square');
    gameOverOsc.amp(0);
    
    // Start thruster
    if (soundEnabled) {
      thrusterOsc.start();
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

// Play engine sound - now a simple retro thruster sound
function updateEngineSound() {
  if (soundEnabled && thrusterOsc) {
    if (keyIsDown(UP_ARROW)) {
      // Simple arcade thruster sound
      thrusterOsc.freq(200);
      thrusterOsc.amp(0.05, 0.1);
    } else {
      thrusterOsc.amp(0, 0.1);
    }
  }
}

// Play game over sound sequence
function playGameOverSound() {
  if (soundEnabled && gameOverOsc) {
    gameOverOsc.start();
    // Classic arcade game over sequence
    const sequence = [
      { freq: 440, duration: 100 },  // A4
      { freq: 349.23, duration: 100 },  // F4
      { freq: 293.66, duration: 100 },  // D4
      { freq: 261.63, duration: 300 },  // C4
      { freq: 207.65, duration: 400 }   // G#3
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
  if (gameOverOsc) gameOverOsc.stop();
}

function initializeGame() {
  // Reset game state
  player = new Player(width / 2, height / 2, 20);
  enemies = [];
  bullets = [];
  score = 0;
  gameOver = false;
  
  // Start thruster sound
  if (soundEnabled) {
    thrusterOsc.start();
  }
  
  // Generate neural network background patterns
  neuralPatterns = [];
  for (let i = 0; i < 20; i++) {
    neuralPatterns.push({
      x: random(width),
      y: random(height),
      connections: []
    });
    // Create random connections
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
    for (let enemy of enemies) {
      enemy.update();
    }
    for (let bullet of bullets) {
      bullet.update();
    }

    // Spawn enemies every 60 frames
    if (frameCount % 60 === 0) {
      let ex = random(width); // Random x position at top
      let ey = 0;
      let evx = random(-1, 1); // Slight horizontal drift
      let evy = 2; // Downward speed
      let er = 10; // Enemy radius
      enemies.push(new Enemy(ex, ey, evx, evy, er));
    }

    // Fire bullet with cooldown
    if (keyIsDown(32) && millis() - lastShotTime > 200) { // Spacebar, 200ms cooldown
      // Bullet starts at ship's tip
      let bx = player.x - sin(player.angle) * (player.size / 2);
      let by = player.y - cos(player.angle) * (player.size / 2);
      let bvx = -sin(player.angle) * 5; // Bullet speed in ship's direction
      let bvy = -cos(player.angle) * 5;
      bullets.push(new Bullet(bx, by, bvx, bvy));
      lastShotTime = millis();
      playLaserSound(); // Play laser sound
    }

    // Check collisions
    for (let bullet of bullets) {
      for (let enemy of enemies) {
        if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.radius + enemy.radius) {
          bullet.isAlive = false;
          enemy.isAlive = false;
          score += 1; // Increment score on hit
          playExplosionSound(); // Play explosion sound
        }
      }
    }
    for (let enemy of enemies) {
      if (dist(player.x, player.y, enemy.x, enemy.y) < player.radius + enemy.radius) {
        gameOver = true;
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
  } else {
    // Game over screen
    drawGameOver();
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
    this.rotationSpeed = 0.1; // Increased rotation speed
    this.acceleration = 0.3;  // Increased acceleration
    this.friction = 0.98;     // Added friction for better control
    this.maxSpeed = 7;        // Increased max speed
  }

  update() {
    // Improved rotation with smoother controls
    if (keyIsDown(LEFT_ARROW)) {
      this.angle -= this.rotationSpeed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.angle += this.rotationSpeed;
    }

    // Thrust forward with improved physics
    if (keyIsDown(UP_ARROW)) {
      this.vx += this.acceleration * (-sin(this.angle));
      this.vy += this.acceleration * (-cos(this.angle));
      // Update engine sound when thrusting
      updateEngineSound();
    } else {
      // Idle engine sound when not thrusting
      updateEngineSound();
    }

    // Add brake/reverse with DOWN arrow
    if (keyIsDown(DOWN_ARROW)) {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }

    // Apply friction to make movement more controlled
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Limit maximum speed
    let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Improved screen wrapping with smoother transition
    if (this.x < -this.size) this.x = width + this.size;
    if (this.x > width + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = height + this.size;
    if (this.y > height + this.size) this.y = -this.size;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    
    // Draw spaceship with improved visuals
    fill(255);
    stroke(100, 200, 255);
    strokeWeight(2);
    triangle(-this.size / 2, this.size / 2, this.size / 2, this.size / 2, 0, -this.size / 2);
    
    // Enhanced thrust effect
    if (keyIsDown(UP_ARROW)) {
      noStroke();
      // Main thrust
      fill(255, 100, 0);
      triangle(-this.size / 4, this.size / 2, this.size / 4, this.size / 2, 0, this.size / 2 + random(this.size / 2, this.size));
      // Side thrusters
      fill(255, 50, 0);
      triangle(-this.size / 4, this.size / 2, -this.size / 3, this.size / 2, -this.size / 4, this.size / 2 + random(this.size / 4));
      triangle(this.size / 4, this.size / 2, this.size / 3, this.size / 2, this.size / 4, this.size / 2 + random(this.size / 4));
    }
    pop();
  }
}

// Enemy class for asteroids
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
    this.type = floor(random(3)); // 3 different AI ship types
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
    
    // Pulsing glow effect
    let glowSize = this.radius * 2 + sin(this.pulsePhase) * 5;
    let glowAlpha = map(sin(this.pulsePhase), -1, 1, 50, 150);
    
    // Draw glow
    noStroke();
    for (let i = 3; i > 0; i--) {
      fill(0, 150, 255, glowAlpha / (i * 2));
      ellipse(0, 0, glowSize + i * 10);
    }
    
    switch(this.type) {
      case 0: // Hexagonal AI Core
        stroke(0, 200, 255);
        strokeWeight(2);
        fill(0, 50, 100);
        beginShape();
        for (let i = 0; i < 6; i++) {
          let angle = i * TWO_PI / 6;
          vertex(cos(angle) * this.radius, sin(angle) * this.radius);
        }
        endShape(CLOSE);
        // Inner details
        stroke(0, 255, 255, this.glowIntensity);
        line(-this.radius/2, 0, this.radius/2, 0);
        line(0, -this.radius/2, 0, this.radius/2);
        break;
        
      case 1: // Neural Network Node
        stroke(255, 100, 200);
        strokeWeight(2);
        fill(100, 0, 100);
        ellipse(0, 0, this.radius * 2);
        // Synaptic connections
        for (let i = 0; i < 4; i++) {
          let angle = i * TWO_PI / 4;
          stroke(255, 100, 200, this.glowIntensity);
          line(cos(angle) * this.radius * 0.5, sin(angle) * this.radius * 0.5,
               cos(angle) * this.radius, sin(angle) * this.radius);
        }
        break;
        
      case 2: // Quantum Computer Core
        stroke(200, 255, 0);
        strokeWeight(2);
        fill(50, 100, 0);
        // Draw quantum bits
        for (let i = 0; i < 3; i++) {
          rotate(TWO_PI / 3);
          rect(-this.radius * 0.4, -this.radius * 0.4, 
               this.radius * 0.8, this.radius * 0.8);
        }
        // Energy core
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
    this.radius = 2; // Small radius for collision
    this.isAlive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Remove bullet if it goes off-screen
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.isAlive = false;
    }
  }

  draw() {
    // Draw bullet as a small white circle
    fill(255);
    ellipse(this.x, this.y, this.radius * 2);
  }
}

// Update the score display to be more tech-themed
function drawScore() {
  fill(0, 150, 255);
  noStroke();
  rect(10, 10, 150, 30, 5);
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("NEURAL SCORE: " + score, 20, 25);
}

// Update game over screen
function drawGameOver() {
  background(0);
  
  // Draw pixelated "GAME OVER" text
  push();
  textAlign(CENTER, CENTER);
  textSize(72);
  textStyle(BOLD);
  
  // Red outline/shadow effect
  for(let i = -2; i <= 2; i++) {
    for(let j = -2; j <= 2; j++) {
      if(i !== 0 || j !== 0) {
        fill(255, 0, 0);
        text("GAME OVER", width/2 + i, height/2 - 40 + j);
      }
    }
  }
  
  // Yellow main text
  fill(255, 255, 0);
  text("GAME OVER", width/2, height/2 - 40);
  pop();
  
  // Score display
  textSize(24);
  fill(255);
  text("FINAL SCORE: " + score, width/2, height/2 + 40);
  
  // Blinking restart text
  if (frameCount % 60 < 30) {
    textSize(20);
    fill(255);
    text("PRESS SPACE TO CONTINUE", width/2, height/2 + 80);
  }
  
  // Scanline effect
  for (let y = 0; y < height; y += 4) {
    stroke(0, 0, 0, 50);
    line(0, y, width, y);
  }
}

// Update keyPressed function
function keyPressed() {
  if (gameOver && keyCode === 32) { // SPACE key
    initializeGame();
  }
}
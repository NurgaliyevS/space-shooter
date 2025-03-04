// Global variables
let player;
let enemies = [];
let bullets = [];
let stars = [];
let score = 0;
let gameOver = false;
let lastShotTime = 0;

function setup() {
  createCanvas(800, 600);
  // Initialize player at center of canvas with size 20
  player = new Player(width / 2, height / 2, 20);
  // Generate 100 stars with random positions and sizes
  for (let i = 0; i < 100; i++) {
    stars.push({ x: random(width), y: random(height), size: random(1, 3) });
  }
}

function draw() {
  background(0); // Black background for space

  // Draw starry background
  fill(255); // White color for stars
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
    }

    // Check collisions
    for (let bullet of bullets) {
      for (let enemy of enemies) {
        if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.radius + enemy.radius) {
          bullet.isAlive = false;
          enemy.isAlive = false;
          score += 1; // Increment score on hit
        }
      }
    }
    for (let enemy of enemies) {
      if (dist(player.x, player.y, enemy.x, enemy.y) < player.radius + enemy.radius) {
        gameOver = true; // End game on player-enemy collision
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
    fill(255);
    textSize(16);
    text("Score: " + score, 10, 20);
  } else {
    // Game over screen
    fill(255);
    textSize(32);
    textAlign(CENTER);
    text("Game Over", width / 2, height / 2);
    text("Final Score: " + score, width / 2, height / 2 + 40);
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
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Remove enemy if it goes off the bottom
    if (this.y > height) {
      this.isAlive = false;
    }
  }

  draw() {
    // Draw enemy as a gray circle
    fill(150);
    ellipse(this.x, this.y, this.radius * 2);
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
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {
    left: false,
    right: false,
    up: false,
    upPressed: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
});

const gravity = 0.5;
const friction = 0.8;

const camera = {
    x: 0,
    y: 0
};

const player = {
    x: 50,
    y: 0,
    width: 50,
    height: 50,
    color: '#FFDD00',
    velX: 0,
    velY: 0,
    speed: 4,
    jumping: false,
    grounded: false,
    hasDoubleJump: false,
    usedDoubleJump: false
};

let coins = [];
let platforms = [];

function generateInfinitePlatforms(x, y) {
    for (let i = 0; i < 50; i++) {
        const width = 150 + Math.floor(Math.random() * 60);
        platforms.push({ x, y, width, height: 20 });

        if (i % 30 === 0) {
            coins.push({
            x: x + width / 2 - 10,
            y: y - 40,
            size: 20,
            collected: false
            });
        }

        const verticalStep = (Math.random() < 0.5) ? -Math.random() * 50 : Math.random() * 30;
        y = Math.min(668, y + verticalStep);
        x += 315 + Math.random() * 100;
    }
}

function generatePlatforms() {
    platforms = [];
    coins = [];

    platforms.push({ x: -128, y: 0, width: 50, height: window.innerHeight-150 });
    platforms.push({ x: -96, y: window.innerHeight-200, width: 400, height: 50 });

    let x = 400;
    let y = window.innerHeight-250;

    generateInfinitePlatforms(x, y);
}

generatePlatforms();

function checkCollision(rect1, rect2) {
    return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
    );
}

function resolveCollisions() {
    player.grounded = false;
    for (let plat of platforms) {
    const vx = (player.x + player.width / 2) - (plat.x + plat.width / 2);
    const vy = (player.y + player.height / 2) - (plat.y + plat.height / 2);
    const combinedHalfWidths = player.width / 2 + plat.width / 2;
    const combinedHalfHeights = player.height / 2 + plat.height / 2;

    if (Math.abs(vx) < combinedHalfWidths && Math.abs(vy) < combinedHalfHeights) {
        const overlapX = combinedHalfWidths - Math.abs(vx);
        const overlapY = combinedHalfHeights - Math.abs(vy);

        if (overlapX >= overlapY) {
        if (vy > 0) {
            player.y += overlapY;
            player.velY = 0;
        } else {
            player.y -= overlapY;
            player.velY = 0;
            player.jumping = false;
            player.grounded = true;
            player.usedDoubleJump = false;
        }
        } else {
        if (vx > 0) {
            player.x += overlapX;
        } else {
            player.x -= overlapX;
        }
        player.velX = 0;
        }
    }
    }
}

let bgOffset = 0;
const bgSpeed = 0.3;

function update() {
    if (keys.left) player.velX = -player.speed;
    if (keys.right) player.velX = player.speed;

    if (keys.up && !keys.upPressed) {
        keys.upPressed = true;
        if (!player.jumping && player.grounded) {
            player.jumping = true;
            player.grounded = false;
            player.velY = -13;
        } else if (!player.grounded && player.hasDoubleJump && !player.usedDoubleJump) {
            player.velY = -13;
            player.usedDoubleJump = true;
            player.hasDoubleJump = false;
        }
    }

    if (!keys.up) keys.upPressed = false;

    player.velY += gravity;
    player.x += player.velX;
    player.y += player.velY;

    for (let coin of coins) {
        if (!coin.collected &&
            player.x < coin.x + coin.size &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.size &&
            player.y + player.height > coin.y) {
            coin.collected = true;
            player.hasDoubleJump = true;
        }
    }

    resolveCollisions();

    player.color = player.hasDoubleJump ? '#00FF00' : '#FFDD00';
    document.getElementById('distance').innerHTML = Math.floor(parseInt(player.x) / 100)+'m';

    player.velX *= friction;

    if (player.x > canvas.width * 0.5 + camera.x) camera.x = player.x - canvas.width * 0.5;
    if (player.x < canvas.width * 0.5 + camera.x) camera.x = player.x - canvas.width * 0.5;

    bgOffset = camera.x * bgSpeed;

    if (player.y > canvas.height) {
        player.y = 0;
        player.velY = 0;
        player.x = 0;
        player.hasDoubleJump = false;
        player.usedDoubleJump = false;
        generatePlatforms();
    }
}

function drawBackground() {
    const stripeWidth = 200;
    ctx.fillStyle = '#222';
    for (let i = 0; i < canvas.width + stripeWidth; i += stripeWidth) {
    ctx.fillRect(i - (bgOffset % stripeWidth), 0, stripeWidth / 2, canvas.height);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    for (let coin of coins) {
    if (!coin.collected) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#444';
    for (let plat of platforms) {
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    }

    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
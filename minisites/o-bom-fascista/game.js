const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 576,
    parent: 'game-container',
    backgroundColor: '#87CEEB', // Sky blue
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game variables
let player;
let cursors;
let platforms;
let npcs = [];
let coins;
let score = 0;
let scoreText;
let dialogueActive = false;
let currentNPC = null;
let dialogueBox, dialogueText, npcNameText;
let interactPrompt;

function preload() {
    // Show loading message
    document.getElementById('loading').style.display = 'block';
    
    console.log('Loading local assets...');
    
    // Load character sprites
    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
        frameWidth: 50,
        frameHeight: 37
    });
    
    // Load NPCs
    this.load.image('npc1', 'assets/sprites/npc1.png');
    this.load.image('npc2', 'assets/sprites/npc2.png');
    
    // Load tiles/platforms
    this.load.image('ground', 'assets/tiles/ground.png');
    this.load.image('platform', 'assets/tiles/grassMid.png');
    this.load.image('box', 'assets/tiles/box.png');
    this.load.image('sky', 'assets/tiles/sky.png');
    
    // Load UI/collectibles
    this.load.spritesheet('coin', 'assets/ui/coin.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    
    // Load placeholder if files don't exist
    this.load.on('fileerror', (file) => {
        console.warn(`Failed to load: ${file.key}`);
        // Create placeholder
        if (file.key === 'hero') {
            createPlayerPlaceholder(this);
        }
    });
    
    // Hide loading when complete
    this.load.on('complete', () => {
        console.log('Assets loaded!');
        document.getElementById('loading').style.display = 'none';
    });

    console.log('Current working directory:', window.location.pathname);
    console.log('Attempting to load from:', 'assets/sprites/hero.png');
}

function createPlayerPlaceholder(scene) {
    // Create a simple colored rectangle as placeholder
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x3498db, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture('hero-placeholder', 32, 48);
    graphics.destroy();
    
    scene.textures.get('hero-placeholder').setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function create() {
    // Create background
    this.add.tileSprite(0, 0, 4000, 600, 'sky').setOrigin(0, 0).setScrollFactor(0.1, 1);
    
    // Create distant buildings (procedural)
    createCityBackground(this);
    
    // Create platforms
    platforms = this.physics.add.staticGroup();
    
    // Ground platform (spans entire level)
    for (let x = 0; x < 4000; x += 64) {
        let ground = platforms.create(x, 550, 'ground');
        ground.setScale(0.5).refreshBody();
        ground.setOrigin(0, 0);
    }
    
    // Add floating platforms
    platforms.create(400, 400, 'platform').setScale(2, 1).refreshBody();
    platforms.create(700, 350, 'platform').setScale(1.5, 1).refreshBody();
    platforms.create(1000, 300, 'platform').setScale(2, 1).refreshBody();
    platforms.create(1500, 400, 'box').setScale(2).refreshBody();
    platforms.create(2000, 350, 'box').setScale(2).refreshBody();
    
    // Create player
    player = this.physics.add.sprite(100, 450, 'hero');
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);
    player.setScale(1.5);
    
    // Create player animations
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'idle',
        frames: [{ key: 'hero', frame: 4 }],
        frameRate: 10
    });
    
    this.anims.create({
        key: 'jump',
        frames: [{ key: 'hero', frame: 10 }],
        frameRate: 10
    });
    
    // Create coins
    coins = this.physics.add.group({
        key: 'coin',
        repeat: 19,
        setXY: { x: 200, y: 0, stepX: 150 }
    });
    
    coins.children.iterate((child) => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setScale(0.8);
        child.y = Phaser.Math.Between(100, 400);
    });
    
    // Coin animation
    this.anims.create({
        key: 'spin',
        frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
    });
    coins.playAnimation('spin');
    
    // Create NPCs
    createNPCs(this);
    
    // Setup collisions
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(coins, platforms);
    this.physics.add.collider(npcs, platforms);
    
    // Coin collection
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    
    // Camera setup
    this.cameras.main.setBounds(0, 0, 4000, 600);
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    
    // Controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // WASD controls
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    
    // Create HUD
    createHUD(this);
    
    // Create dialogue system
    createDialogueSystem(this);
    
    // Instructions
    this.add.text(20, 540, 'Arrow Keys/WASD: Move | Space: Jump | E: Talk to NPCs', {
        fontSize: '16px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 3
    }).setScrollFactor(0);
}

function createCityBackground(scene) {
    // Create building silhouettes for depth
    const graphics = scene.add.graphics();
    
    // Distant buildings (dark)
    graphics.fillStyle(0x2c3e50, 1);
    for (let i = 0; i < 20; i++) {
        const height = Phaser.Math.Between(80, 180);
        const width = Phaser.Math.Between(60, 100);
        const x = i * 200 + Phaser.Math.Between(-50, 50);
        graphics.fillRect(x, 400 - height, width, height);
    }
    
    graphics.setScrollFactor(0.3, 1);
    
    // Closer buildings (medium)
    const graphics2 = scene.add.graphics();
    graphics2.fillStyle(0x34495e, 1);
    for (let i = 0; i < 30; i++) {
        const height = Phaser.Math.Between(100, 250);
        const width = Phaser.Math.Between(80, 120);
        const x = i * 150 + Phaser.Math.Between(-30, 30);
        graphics2.fillRect(x, 400 - height, width, height);
        
        // Add windows
        graphics2.fillStyle(0xf1c40f, 0.8);
        for (let wx = x + 10; wx < x + width - 10; wx += 20) {
            for (let wy = 400 - height + 20; wy < 380; wy += 25) {
                if (Math.random() > 0.5) {
                    graphics2.fillRect(wx, wy, 10, 15);
                }
            }
        }
        graphics2.fillStyle(0x34495e, 1);
    }
    graphics2.setScrollFactor(0.6, 1);
}

function createNPCs(scene) {
    const npcData = [
        { x: 300, y: 480, sprite: 'npc1', name: 'Old Man', 
          dialogue: 'Welcome traveler! This city has seen better days. Watch your step.' },
        { x: 800, y: 480, sprite: 'npc2', name: 'Guard', 
          dialogue: 'Halt! The eastern district is dangerous. You\'ll need better gear.' },
        { x: 1500, y: 480, sprite: 'npc1', name: 'Merchant', 
          dialogue: 'I sell rare items. Come back when you have more coins!' },
        { x: 2200, y: 380, sprite: 'npc2', name: 'Explorer', 
          dialogue: 'Legends speak of ancient ruins beyond the mountains. Are you brave enough?' }
    ];
    
    npcData.forEach((data, index) => {
        const npc = scene.physics.add.sprite(data.x, data.y, data.sprite);
        npc.setScale(3);
        npc.body.setAllowGravity(false);
        npc.setImmovable(true);
        
        // NPC properties
        npc.dialogue = data.dialogue;
        npc.name = data.name;
        npc.id = index;
        
        // Add floating name
        const nameText = scene.add.text(data.x, data.y - 50, data.name, {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3,
            fontStyle: 'bold'
        });
        nameText.setOrigin(0.5);
        nameText.setScrollFactor(1);
        
        // Add interaction zone indicator
        const zone = scene.add.circle(data.x, data.y, 60, 0x00ff00, 0.1);
        zone.setScrollFactor(1);
        
        npc.interactionZone = zone;
        npc.nameText = nameText;
        
        npcs.push(npc);
    });
}

function createHUD(scene) {
    // Score display
    scoreText = scene.add.text(20, 20, 'COINS: 0', {
        fontSize: '32px',
        fill: '#f1c40f',
        stroke: '#000',
        strokeThickness: 4,
        fontStyle: 'bold'
    });
    scoreText.setScrollFactor(0);
    
    // Health bar (placeholder)
    const healthBar = scene.add.rectangle(20, 70, 200, 20, 0x2ecc71);
    healthBar.setScrollFactor(0);
    healthBar.setOrigin(0, 0);
    
    const healthBorder = scene.add.graphics();
    healthBorder.lineStyle(3, 0x000000, 1);
    healthBorder.strokeRect(20, 70, 200, 20);
    healthBorder.setScrollFactor(0);
}

function createDialogueSystem(scene) {
    // Dialogue background
    dialogueBox = scene.add.rectangle(512, 450, 900, 140, 0x000000, 0.9);
    dialogueBox.setOrigin(0.5);
    dialogueBox.setScrollFactor(0);
    dialogueBox.setStrokeStyle(3, 0xf1c40f);
    dialogueBox.visible = false;
    
    // NPC name
    npcNameText = scene.add.text(512, 380, '', {
        fontSize: '24px',
        fill: '#f1c40f',
        stroke: '#000',
        strokeThickness: 4,
        fontStyle: 'bold'
    });
    npcNameText.setOrigin(0.5);
    npcNameText.setScrollFactor(0);
    npcNameText.visible = false;
    
    // Dialogue text
    dialogueText = scene.add.text(512, 430, '', {
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: 800 }
    });
    dialogueText.setOrigin(0.5);
    dialogueText.setScrollFactor(0);
    dialogueText.visible = false;
    
    // Continue prompt
    const continueText = scene.add.text(512, 510, 'Press SPACE to continue', {
        fontSize: '18px',
        fill: '#f1c40f',
        stroke: '#000',
        strokeThickness: 3,
        fontStyle: 'italic'
    });
    continueText.setOrigin(0.5);
    continueText.setScrollFactor(0);
    continueText.visible = false;
    
    dialogueBox.continueText = continueText;
    
    // Interaction prompt
    interactPrompt = scene.add.text(512, 200, 'Press E to talk', {
        fontSize: '24px',
        fill: '#00ff00',
        stroke: '#000',
        strokeThickness: 4
    });
    interactPrompt.setOrigin(0.5);
    interactPrompt.setScrollFactor(0);
    interactPrompt.visible = false;
}

function update() {
    // Horizontal movement
    let speed = 200;
    let moving = false;
    
    if (cursors.left.isDown || this.aKey.isDown) {
        player.setVelocityX(-speed);
        player.setFlipX(true);
        if (player.body.touching.down) {
            player.anims.play('walk', true);
        }
        moving = true;
    } else if (cursors.right.isDown || this.dKey.isDown) {
        player.setVelocityX(speed);
        player.setFlipX(false);
        if (player.body.touching.down) {
            player.anims.play('walk', true);
        }
        moving = true;
    } else {
        player.setVelocityX(0);
        if (player.body.touching.down) {
            player.anims.play('idle', true);
        }
    }
    
    // Jumping
    if ((cursors.up.isDown || this.wKey.isDown || Phaser.Input.Keyboard.JustDown(cursors.space)) && player.body.touching.down) {
        player.setVelocityY(-450);
        player.anims.play('jump', true);
    }
    
    // Check for nearby NPCs
    checkNearbyNPCs(this);
    
    // Handle dialogue continuation
    if (dialogueActive && Phaser.Input.Keyboard.JustDown(cursors.space)) {
        closeDialogue();
    }
}

function checkNearbyNPCs(scene) {
    let nearbyNPC = null;
    let minDistance = 80;
    
    npcs.forEach(npc => {
        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            npc.x, npc.y
        );
        
        if (distance < minDistance) {
            nearbyNPC = npc;
            minDistance = distance;
        }
        
        // Highlight NPC when nearby
        npc.interactionZone.fillAlpha = distance < 100 ? 0.2 : 0.1;
    });
    
    // Show interaction prompt
    if (nearbyNPC && !dialogueActive) {
        interactPrompt.visible = true;
        interactPrompt.setText(`Press E to talk to ${nearbyNPC.name}`);
        
        // Handle E key press for interaction
        if (Phaser.Input.Keyboard.JustDown(scene.eKey)) {
            showDialogue(nearbyNPC);
        }
    } else {
        interactPrompt.visible = false;
    }
}

function showDialogue(npc) {
    dialogueActive = true;
    currentNPC = npc;
    
    // Show dialogue UI
    dialogueBox.visible = true;
    npcNameText.visible = true;
    dialogueText.visible = true;
    dialogueBox.continueText.visible = true;
    
    // Set dialogue content
    npcNameText.setText(npc.name);
    dialogueText.setText(npc.dialogue);
    
    // Pause player movement
    player.setVelocityX(0);
}

function closeDialogue() {
    dialogueActive = false;
    currentNPC = null;
    
    // Hide dialogue UI
    dialogueBox.visible = false;
    npcNameText.visible = false;
    dialogueText.visible = false;
    dialogueBox.continueText.visible = false;
}

function collectCoin(player, coin) {
    coin.disableBody(true, true);
    score += 10;
    scoreText.setText(`COINS: ${score}`);
    
    // Create coin collection effect
    const scene = player.scene;
    const effect = scene.add.text(coin.x, coin.y - 20, '+10', {
        fontSize: '24px',
        fill: '#f1c40f',
        stroke: '#000',
        strokeThickness: 3
    });
    effect.setOrigin(0.5);
    
    // Animate the effect
    scene.tweens.add({
        targets: effect,
        y: effect.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => effect.destroy()
    });
}
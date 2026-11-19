const W = 960, H = 540;

const levelData = [
    {
        name: 'THE AWAKENING',
        need: 3,
        platforms: [
            [0, 500, 960, 40],
            [120, 410, 170, 18],
            [360, 345, 150, 18],
            [590, 280, 155, 18],
            [790, 400, 120, 18]
        ],
        crystals: [[205, 370], [430, 305], [660, 240], [830, 355]],
        spikes: [[320, 480, 90, 20], [520, 480, 100, 20]],
        exit: [880, 445]
    },
    {
        name: 'THE SUNKEN HALL',
        need: 4,
        platforms: [
            [0, 500, 960, 40],
            [80, 420, 150, 18],
            [290, 350, 130, 18],
            [500, 290, 130, 18],
            [720, 360, 130, 18],
            [850, 440, 90, 18]
        ],
        crystals: [[145, 380], [350, 310], [560, 250], [780, 320], [890, 400]],
        spikes: [[250, 480, 100, 20], [430, 480, 120, 20], [650, 480, 100, 20]],
        exit: [910, 405]
    },
    {
        name: 'THE CORE',
        need: 5,
        platforms: [
            [0, 500, 960, 40],
            [70, 420, 140, 18],
            [260, 350, 120, 18],
            [440, 280, 130, 18],
            [630, 350, 120, 18],
            [790, 420, 130, 18]
        ],
        crystals: [[130, 380], [320, 310], [500, 240], [690, 310], [850, 380], [915, 455]],
        spikes: [[220, 480, 110, 20], [390, 480, 130, 20], [570, 480, 130, 20], [750, 480, 110, 20]],
        exit: [915, 455]
    }
];

class NeonRelic extends Phaser.Scene {

    constructor() {
        super('game');

        this.level = 0;
        this.collected = 0;
        this.started = false;
        this.paused = false;

        this.mobileInput = {
            left: false,
            right: false,
            jump: false
        };

        this.panelType = null;
    }

    create() {

        this.makeTextures();
        this.drawBackground();

        this.physics.world.setBounds(0, 0, W, H);

        this.keys = this.input.keyboard.addKeys(
            'LEFT,RIGHT,A,D,SPACE,UP,W,ESC'
        );

        this.level = 0;
        this.started = false;
        this.paused = false;

        this.showIntro();
        this.setupTouch();

        this.input.keyboard.on('keydown-ESC', () => {

            if (!this.started) return;

            // ESC should only pause or resume normal gameplay.
            // It should not dismiss level-completion or victory panels.

            if (this.panelType === 'levelcomplete' ||
                this.panelType === 'win') {
                return;
            }

            this.togglePause();
        });
    }

    makeTextures() {

        const g = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        // Background tile texture

        g.fillStyle(0x17263d);
        g.fillRect(0, 0, 10, 10);

        g.lineStyle(1, 0x334a68);
        g.strokeRect(0, 0, 10, 10);

        g.generateTexture('tile', 10, 10);
        g.clear();

        // Platform texture

        g.fillStyle(0x263751);
        g.fillRect(0, 0, 100, 18);

        g.lineStyle(2, 0x52718e);
        g.strokeRect(0, 0, 100, 18);

        g.lineStyle(1, 0x18253b);
        g.lineBetween(10, 5, 90, 5);

        g.generateTexture('platform', 100, 18);
        g.clear();

        // Spike texture

        g.fillStyle(0xff386f);
        g.fillTriangle(0, 20, 12, 0, 24, 20);

        g.generateTexture('spike', 24, 20);
        g.clear();

        // Crystal texture

        g.fillStyle(0x63f9ff);

        g.fillPoints([
            new Phaser.Geom.Point(12, 0),
            new Phaser.Geom.Point(24, 12),
            new Phaser.Geom.Point(12, 24),
            new Phaser.Geom.Point(0, 12)
        ], true);

        g.generateTexture('crystal', 24, 24);
        g.clear();

        // Player texture

        g.fillStyle(0x9b62ff);
        g.fillRect(0, 0, 28, 44);

        g.lineStyle(3, 0x60f5ff);
        g.strokeRect(0, 0, 28, 44);

        g.generateTexture('player', 28, 44);
        g.clear();

        // Portal texture

        g.fillStyle(0x42ffb4);
        g.fillRect(0, 0, 40, 64);

        g.lineStyle(3, 0xb5ffe5);
        g.strokeRect(0, 0, 40, 64);

        g.generateTexture('portal', 40, 64);

        g.destroy();
    }

    drawBackground() {

        this.bg = this.add.graphics();

        this.bg.fillGradientStyle(
            0x0a1023,
            0x0a1023,
            0x151b38,
            0x151b38,
            1
        );

        this.bg.fillRect(0, 0, W, H);

        // Stars

        for (let i = 0; i < 95; i++) {

            let x = Phaser.Math.Between(0, W);
            let y = Phaser.Math.Between(0, H);

            this.bg.fillStyle(
                0x83dfff,
                Phaser.Math.FloatBetween(0.15, 0.65)
            );

            this.bg.fillCircle(
                x,
                y,
                Phaser.Math.Between(1, 2)
            );
        }

        // Grid

        this.bg.lineStyle(1, 0x152747, 0.5);

        for (let x = 0; x < W; x += 48) {
            this.bg.lineBetween(x, 0, x, H);
        }

        for (let y = 0; y < H; y += 48) {
            this.bg.lineBetween(0, y, W, y);
        }
    }

    showIntro() {

        this.overlay = this.add.container(0, 0);

        let dim = this.add.rectangle(
            W / 2,
            H / 2,
            W,
            H,
            0x050914,
            0.84
        );

        let title = this.add.text(
            W / 2,
            145,
            'NEON RELIC',
            {
                fontFamily: 'Orbitron',
                fontSize: '48px',
                fontStyle: 'bold',
                color: '#7cf7ff',
                stroke: '#10223a',
                strokeThickness: 5
            }
        ).setOrigin(0.5);

        let sub = this.add.text(
            W / 2,
            205,
            'ESCAPE THE RUINS · COLLECT THE CRYSTALS',
            {
                fontFamily: 'Orbitron',
                fontSize: '16px',
                color: '#c1d8ff'
            }
        ).setOrigin(0.5);

        let desc = this.add.text(
            W / 2,
            265,
            'Explore three chambers. Gather relics. Avoid the spikes.\nReach the portal to escape.',
            {
                fontFamily: 'Rajdhani',
                fontSize: '24px',
                align: 'center',
                color: '#b9cce8',
                lineSpacing: 7
            }
        ).setOrigin(0.5);

        let btn = this.add.text(
            W / 2,
            370,
            '▶  START EXPEDITION',
            {
                fontFamily: 'Orbitron',
                fontSize: '22px',
                color: '#081321',
                backgroundColor: '#74f6ff',
                padding: {
                    x: 22,
                    y: 15
                }
            }
        ).setOrigin(0.5).setInteractive({
            useHandCursor: true
        });

        btn.on('pointerdown', () => {
            this.startLevel(0);
        });

        this.overlay.add([
            dim,
            title,
            sub,
            desc,
            btn
        ]);
    }

    startLevel(n) {

        // Resume the physics world in case it was paused
        // by the previous chamber's completion screen.

        this.physics.world.resume();

        // Remove previous overlays

        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        if (this.pauseLayer) {
            this.pauseLayer.destroy();
            this.pauseLayer = null;
        }

        this.panelType = null;

        this.level = n;
        this.collected = 0;
        this.started = true;
        this.paused = false;

        // Clear previous level objects

        if (this.platforms) this.platforms.clear(true, true);
        if (this.crystals) this.crystals.clear(true, true);
        if (this.hazards) this.hazards.clear(true, true);

        if (this.player) this.player.destroy();
        if (this.portal) this.portal.destroy();
        if (this.hud) this.hud.destroy();
        if (this.pauseText) this.pauseText.destroy();

        const data = levelData[n];

        // Platforms

        this.platforms = this.physics.add.staticGroup();

        data.platforms.forEach(p => {

            let obj = this.platforms.create(
                p[0] + p[2] / 2,
                p[1] + p[3] / 2,
                'platform'
            );

            obj.setDisplaySize(p[2], p[3]);
            obj.refreshBody();
        });

        // Player

        this.player = this.physics.add.sprite(
            65,
            440,
            'player'
        );

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        this.player.setMaxVelocity(330, 700);

        this.player.body.setSize(22, 40);
        this.player.body.setOffset(3, 2);

        this.physics.add.collider(
            this.player,
            this.platforms
        );

        // Crystals

        this.crystals = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        data.crystals.forEach(p => {

            let c = this.crystals.create(
                p[0],
                p[1],
                'crystal'
            );

            c.setScale(0.85);
            c.setCircle(10);

            this.tweens.add({
                targets: c,
                y: c.y - 8,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.physics.add.overlap(
            this.player,
            this.crystals,
            this.collectCrystal,
            null,
            this
        );

        // Spikes

        this.hazards = this.physics.add.staticGroup();

        data.spikes.forEach(p => {

            for (let x = p[0]; x < p[0] + p[2]; x += 24) {

                let s = this.hazards.create(
                    x + 12,
                    p[1] + 10,
                    'spike'
                );

                s.setOrigin(0.5);
            }
        });

        this.physics.add.overlap(
            this.player,
            this.hazards,
            () => this.hitHazard(),
            null,
            this
        );

        // Portal

        this.portal = this.physics.add.staticSprite(
            data.exit[0],
            data.exit[1],
            'portal'
        );

        this.portal.setTint(0x52657a);

        this.physics.add.overlap(
            this.player,
            this.portal,
            () => this.tryExit(),
            null,
            this
        );

        // HUD

        this.hud = this.add.container(0, 0);

        let panel = this.add.rectangle(
            15,
            15,
            420,
            60,
            0x071020,
            0.9
        ).setOrigin(0);

        let txt = this.add.text(
            30,
            25,
            `${n + 1}/3  ${data.name}\nCRYSTALS: 0 / ${data.need}`,
            {
                fontFamily: 'Orbitron',
                fontSize: '15px',
                color: '#b7f8ff',
                lineSpacing: 4
            }
        );

        this.hud.add([
            panel,
            txt
        ]);

        this.hudText = txt;

        this.pauseText = this.add.text(
            W - 16,
            16,
            'ESC: PAUSE',
            {
                fontFamily: 'Orbitron',
                fontSize: '11px',
                color: '#8ca4c7'
            }
        ).setOrigin(1, 0);

        this.levelNeed = data.need;

        this.updatePortal();
    }

    collectCrystal(player, c) {

        if (!c.active || this.paused) return;

        c.destroy();

        this.collected++;

        this.hudText.setText(
            `${this.level + 1}/3  ${levelData[this.level].name}\nCRYSTALS: ${this.collected} / ${this.levelNeed}`
        );

        this.updatePortal();

        this.popText(
            player.x,
            player.y - 30,
            '+ RELIC',
            '#71faff'
        );
    }

    updatePortal() {

        if (!this.portal) return;

        if (this.collected >= this.levelNeed) {

            this.portal.setTint(0xffffff);
            this.portal.setAlpha(1);

        } else {

            this.portal.setTint(0x53657a);
        }
    }

    tryExit() {

        // Prevent the overlap callback from triggering repeatedly.

        if (!this.started || this.paused) return;

        if (this.collected < this.levelNeed) {

            this.popText(
                this.portal.x,
                this.portal.y - 70,
                `NEED ${this.levelNeed - this.collected} MORE RELICS`,
                '#ff8ab6'
            );

            return;
        }

        // Lock the game before displaying the completion panel.

        this.paused = true;
        this.physics.world.pause();

        this.player.setVelocity(0, 0);

        if (this.level < 2) {

            this.showLevelComplete();

        } else {

            this.showWin();
        }
    }

    hitHazard() {

        if (!this.started || this.paused) return;

        this.player.setPosition(65, 440);
        this.player.setVelocity(0, 0);

        this.popText(
            W / 2,
            120,
            'RECALIBRATED',
            '#ff7a9b'
        );
    }

    popText(x, y, msg, color) {

        let t = this.add.text(
            x,
            y,
            msg,
            {
                fontFamily: 'Orbitron',
                fontSize: '16px',
                color: color,
                stroke: '#050914',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: t,
            y: y - 35,
            alpha: 0,
            duration: 850,
            onComplete: () => t.destroy()
        });
    }

    showLevelComplete() {

        this.paused = true;

        this.player.setVelocity(0, 0);

        this.makePanel(
            `CHAMBER ${this.level + 1} CLEARED`,
            'Relics secured. The next chamber awaits.',
            '▶  NEXT CHAMBER',
            () => this.startLevel(this.level + 1),
            'levelcomplete'
        );
    }

    showWin() {

        this.paused = true;

        this.player.setVelocity(0, 0);

        this.makePanel(
            'RELIC RECOVERED',
            'You escaped the ruins! Thanks for playing.',
            '↻  PLAY AGAIN',
            () => this.startLevel(0),
            'win'
        );
    }

    makePanel(title, desc, button, callback, panelType) {

        if (this.pauseLayer) {
            this.pauseLayer.destroy();
        }

        this.panelType = panelType;

        this.pauseLayer = this.add.container(0, 0);

        let d = this.add.rectangle(
            W / 2,
            H / 2,
            W,
            H,
            0x040812,
            0.86
        );

        let t = this.add.text(
            W / 2,
            190,
            title,
            {
                fontFamily: 'Orbitron',
                fontSize: '30px',
                color: '#7cf7ff'
            }
        ).setOrigin(0.5);

        let dt = this.add.text(
            W / 2,
            255,
            desc,
            {
                fontFamily: 'Rajdhani',
                fontSize: '22px',
                color: '#c2d4f2'
            }
        ).setOrigin(0.5);

        let b = this.add.text(
            W / 2,
            345,
            button,
            {
                fontFamily: 'Orbitron',
                fontSize: '18px',
                color: '#071321',
                backgroundColor: '#72f5ff',
                padding: {
                    x: 18,
                    y: 14
                }
            }
        ).setOrigin(0.5).setInteractive({
            useHandCursor: true
        });

        // Ensure button interaction

        b.on('pointerdown', () => {

            if (callback) {
                callback();
            }
        });

        // Visual feedback when hovering

        b.on('pointerover', () => {
            b.setStyle({
                color: '#071321',
                backgroundColor: '#b5fcff'
            });
        });

        b.on('pointerout', () => {
            b.setStyle({
                color: '#071321',
                backgroundColor: '#72f5ff'
            });
        });

        this.pauseLayer.add([
            d,
            t,
            dt,
            b
        ]);

        // Bring the panel above the other game elements.

        this.pauseLayer.setDepth(1000);
    }

    togglePause() {

        if (!this.started) return;

        // Do not allow ESC to dismiss completion or victory panels.

        if (this.panelType === 'levelcomplete' ||
            this.panelType === 'win') {
            return;
        }

        if (this.pauseLayer && this.panelType === 'pause') {

            this.pauseLayer.destroy();
            this.pauseLayer = null;

            this.panelType = null;
            this.paused = false;

            this.physics.world.resume();

            return;
        }

        this.paused = true;
        this.physics.world.pause();

        this.player.setVelocity(0, 0);

        this.makePanel(
            'PAUSED',
            'Take a breath, explorer.',
            '▶  RESUME',
            () => {

                if (this.pauseLayer) {
                    this.pauseLayer.destroy();
                    this.pauseLayer = null;
                }

                this.panelType = null;
                this.paused = false;

                this.physics.world.resume();
            },
            'pause'
        );
    }

    setupTouch() {

        // Prevent duplicate touch-control elements.

        const existing = document.querySelector('.touch-controls');

        if (existing) {
            existing.remove();
        }

        let wrap = document.createElement('div');

        wrap.className = 'touch-controls';

        wrap.innerHTML = `
            <button data-key="left">◀</button>
            <button data-key="jump">▲</button>
            <button data-key="right">▶</button>
        `;

        document.getElementById('game-container').appendChild(wrap);

        wrap.querySelectorAll('button').forEach(b => {

            let k = b.dataset.key;

            b.addEventListener('pointerdown', e => {

                e.preventDefault();

                b.setPointerCapture(e.pointerId);

                this.mobileInput[k] = true;
            });

            [
                'pointerup',
                'pointercancel',
                'lostpointercapture'
            ].forEach(ev => {

                b.addEventListener(ev, () => {
                    this.mobileInput[k] = false;
                });
            });
        });
    }

    update() {

        if (!this.started ||
            this.paused ||
            !this.player?.active) {
            return;
        }

        const left =
            this.keys.LEFT.isDown ||
            this.keys.A.isDown ||
            this.mobileInput.left;

        const right =
            this.keys.RIGHT.isDown ||
            this.keys.D.isDown ||
            this.mobileInput.right;

        const jump =
            this.keys.SPACE.isDown ||
            this.keys.UP.isDown ||
            this.keys.W.isDown ||
            this.mobileInput.jump;

        // Horizontal movement

        this.player.setVelocityX(
            left ? -220 : right ? 220 : 0
        );

        // Jump

        if (jump && this.player.body.blocked.down) {

            this.player.setVelocityY(-470);

            this.mobileInput.jump = false;
        }

        // Player visual feedback

        if (this.player.body.blocked.down) {

            this.player.setTint(0x9b62ff);

        } else {

            this.player.setTint(0x70faff);
        }
    }
}

const config = {

    type: Phaser.AUTO,

    width: W,
    height: H,

    parent: 'game-container',

    backgroundColor: '#080e1c',

    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 900
            },
            debug: false
        }
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    scene: [NeonRelic]
};

new Phaser.Game(config);
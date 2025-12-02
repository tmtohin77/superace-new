// ===================================
// ১. কনফিগারেশন
// ===================================
const LAYOUT = {
    REEL_WIDTH: 105,
    SYMBOL_HEIGHT: 130, 
    GAP: 2, 
    START_Y: 345,
    BTN_W: 240,
    BTN_H: 60
};

const GAME_WIDTH = 540;   
const GAME_HEIGHT = 960;  
const REEL_COUNT = 4; 
const ROW_COUNT = 3;        
const TOTAL_GRID_WIDTH = (LAYOUT.REEL_WIDTH * REEL_COUNT) + (LAYOUT.GAP * (REEL_COUNT - 1));
const START_X = (GAME_WIDTH - TOTAL_GRID_WIDTH) / 2 + (LAYOUT.REEL_WIDTH / 2); 
const SPIN_DURATION_PER_REEL = 200; 
const SYMBOL_SHIFT_COUNT = 15; 
const SYMBOL_KEYS = ['golden_burger', 'ace', 'king', 'queen', 'jack', 'spade'];
const SYMBOL_VALUES = { 'golden_burger': 50, 'ace': 20, 'king': 15, 'queen': 10, 'jack': 8, 'spade': 5 };
const MULTIPLIER_LEVELS = [1, 2, 3, 5]; 

const PAYMENT_NUMBERS = {
    bkash: ["01700000001", "01700000002", "01700000003", "01700000004", "01700000005"],
    nagad: ["01900000001", "01900000002", "01900000003", "01900000004", "01900000005"]
};

// =======================================================
// Scene 0: Preload
// =======================================================
class PreloadScene extends Phaser.Scene {
    constructor() { super('PreloadScene'); }
    preload() {
        const { width, height } = this.scale;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 150, height/2, 300, 40);
        const percentText = this.add.text(width/2, height/2 + 20, '0%', { font: '18px Arial', fill: '#ffffff' }).setOrigin(0.5);

        this.load.path = 'assets/'; 

        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xFFD700, 1);
            progressBar.fillRect(width/2 - 140, height/2 + 10, 280 * value, 20);
        });

        this.load.on('complete', () => { this.scene.start('LoginScene'); });

        this.load.image('background', 'new_background.jpg'); 
        this.load.image('reel_frame_img', 'reel_frame.png'); 
        this.load.image('golden_frame', 'golden_frame.png'); 
        this.load.image('bet_button', 'bet_button.png');
        this.load.image('plus_button', 'plus_button.png'); 
        this.load.image('minus_button', 'minus_button.png'); 
        this.load.image('golden_burger', 'golden_burger.png');
        this.load.image('ace', 'ace.png');
        this.load.image('king', 'king.png');
        this.load.image('queen', 'queen.png');
        this.load.image('jack', 'jack.png');
        this.load.image('spade', 'spade.png');
        this.load.image('coin', 'coin.png'); 
        
        // 🔥 Ensure these exist in assets folder
        this.load.image('sound_on', 'sound_on.png');
        this.load.image('sound_off', 'sound_off.png'); 
        
        this.load.audio('spin_start', 'spin_start.mp3');
        this.load.audio('reel_stop', 'reel_stop.mp3');
        this.load.audio('win_sound', 'win_sound.mp3');
    }
}

// =======================================================
// Scene 1: Login
// =======================================================
class LoginScene extends Phaser.Scene {
    constructor() { super('LoginScene'); this.username = ''; this.password = ''; this.mobile = ''; this.newUsername = ''; this.newPassword = ''; this.refCode = ''; }
    
    create() {
        const { width, height } = this.scale;
        this.add.image(width/2, height/2, 'background').setDisplaySize(width, height);
        this.add.text(width/2, 100, 'SuperAce Casino', { font: 'bold 45px Arial', fill: '#FFD700', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5); 

        const boxY = height/2 + 40;
        this.add.rectangle(width/2, boxY, 480, 650, 0x000000, 0.7).setStrokeStyle(3, 0xFFD700);

        this.loginContainer = this.createLoginUI(width, boxY);
        this.regContainer = this.createRegistrationUI(width, boxY);
        this.regContainer.setVisible(false);
    }

    createInputField(x, y, p, n, isP) { 
        const bg = this.add.rectangle(x, y, 350, 55, 0xFFFFFF).setStrokeStyle(2, 0x555555).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x-160, y, p, { fontSize: '20px', fill: '#555', fontStyle: 'bold' }).setOrigin(0, 0.5);
        bg.on('pointerdown', () => {
            let v = prompt(`${p}:`, this[n] || '');
            if (v !== null) { this[n] = v; txt.setText(v ? (isP ? '•'.repeat(v.length) : v) : p).setFill(v ? '#000' : '#555'); }
        });
        return this.add.container(0, 0, [bg, txt]);
    }

    createBtn(x, y, text, color, txtColor, cb) {
        const c = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 250, 60, color).setInteractive({useHandCursor:true});
        const txt = this.add.text(0, 0, text, { fontSize: '26px', fill: txtColor, fontStyle: 'bold' }).setOrigin(0.5);
        c.add([bg, txt]);
        bg.on('pointerdown', () => {
            this.tweens.add({ targets: c, scale: 0.9, duration: 50, yoyo: true });
            this.time.delayedCall(100, cb);
        });
        return c;
    }

    createLoginUI(w, centerY) {
        const c = this.add.container(0, 0);
        const startY = centerY - 150;
        c.add(this.add.text(w/2, startY, 'MEMBER LOGIN', { fontSize: '32px', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5));
        c.add(this.createInputField(w/2, startY + 80, 'Username / Mobile', 'username', false));
        c.add(this.createInputField(w/2, startY + 160, 'Password', 'password', true));
        c.add(this.createBtn(w/2, startY + 260, 'LOGIN', 0xFFD700, '#000', this.handleLogin.bind(this)));
        const reg = this.add.text(w/2, startY + 340, 'New User? Register Here', { fontSize: '22px', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({useHandCursor:true});
        reg.on('pointerdown', () => { this.loginContainer.setVisible(false); this.regContainer.setVisible(true); });
        c.add(reg); return c;
    }

    createRegistrationUI(w, centerY) {
        const c = this.add.container(0, 0);
        const startY = centerY - 200;
        c.add(this.add.text(w/2, startY, 'REGISTRATION', { fontSize: '32px', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5));
        c.add(this.createInputField(w/2, startY + 70, 'Mobile Number', 'mobile', false));
        c.add(this.createInputField(w/2, startY + 140, 'Username', 'newUsername', false));
        c.add(this.createInputField(w/2, startY + 210, 'Password', 'newPassword', true));
        c.add(this.createInputField(w/2, startY + 280, 'Referral Code (Opt)', 'refCode', false));
        c.add(this.createBtn(w/2, startY + 370, 'REGISTER', 0x00AA00, '#FFF', this.handleRegistration.bind(this)));
        const back = this.add.text(w/2, startY + 450, '<< Back to Login', { fontSize: '22px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({useHandCursor:true});
        back.on('pointerdown', () => { this.loginContainer.setVisible(true); this.regContainer.setVisible(false); });
        c.add(back); return c;
    }
    
    handleLogin() {
        if(!this.username || !this.password) return alert('Enter credentials');
        fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:this.username, password:this.password}) })
        .then(r=>r.json()).then(d=>{ if(d.success) this.scene.start('GameScene', {user:d.user}); else alert(d.message); })
        .catch(()=>alert("Server Error"));
    }
    
    handleRegistration() {
        if(!this.mobile || !this.newUsername || !this.newPassword) return alert('Fill all fields');
        fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mobile:this.mobile, username:this.newUsername, password:this.newPassword, refCode:this.refCode}) })
        .then(r=>r.json()).then(d=>{ alert(d.message); if(d.success){ this.loginContainer.setVisible(true); this.regContainer.setVisible(false); } });
    }
}

// =======================================================
// Scene 2: Main Game
// =======================================================
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.currentUser = null;
        this.soundEnabled = true;
        this.currentWinRate = 30;
        this.winStreak = 0; 
        this.superWinSpinsLeft = 0; 
    }
    
    init(data) {
        if (data && data.user) { 
            this.currentUser = data.user; 
            this.balance = this.currentUser.balance; 
            this.isAdmin = this.currentUser.username === 'admin' || this.currentUser.isAdmin; 
        } else this.scene.start('LoginScene');
    }

    create() {
        this.isSpinning = false; this.currentBet = 10.00; this.reelsStopped = 0;
        const { width, height } = this.scale;
        
        // 1. Background (Depth 0)
        this.add.image(width/2, height/2, 'background').setDisplaySize(width, height).setDepth(0);

        this.coinParticles = this.add.particles('coin');
        this.coinParticles.setDepth(1); 

        const maskShape = this.make.graphics().fillStyle(0xffffff).fillRect(START_X-LAYOUT.REEL_WIDTH/2-5, LAYOUT.START_Y-LAYOUT.SYMBOL_HEIGHT/2-5, TOTAL_GRID_WIDTH+10, (LAYOUT.SYMBOL_HEIGHT*ROW_COUNT)+(LAYOUT.GAP*ROW_COUNT)+20);
        const gridMask = maskShape.createGeometryMask();
        
        // 🔥 Fix 3: Layering
        // Golden Frame (Cell BG) = Depth 2
        // Symbols = Depth 3
        // Reel Frame (Main Grid) = Depth 4
        
        const frameCenterY = LAYOUT.START_Y + ((ROW_COUNT-1)*(LAYOUT.SYMBOL_HEIGHT+LAYOUT.GAP))/2;
        this.add.image(width/2, frameCenterY, 'reel_frame_img').setDisplaySize(TOTAL_GRID_WIDTH+30, (LAYOUT.SYMBOL_HEIGHT*ROW_COUNT)+40).setDepth(4); 
        
        this.symbols = [];
        for (let reel=0; reel<REEL_COUNT; reel++) {
            this.symbols[reel] = []; 
            for (let row=0; row<ROW_COUNT; row++) {
                const x = START_X + reel*(LAYOUT.REEL_WIDTH+LAYOUT.GAP); 
                const y = LAYOUT.START_Y + row*(LAYOUT.SYMBOL_HEIGHT+LAYOUT.GAP); 
                
                // Individual Golden Frame (Depth 2)
                this.add.image(x, y, 'golden_frame').setDisplaySize(LAYOUT.REEL_WIDTH, LAYOUT.SYMBOL_HEIGHT).setDepth(2); 
                
                // Symbol (Depth 3)
                const s = this.add.image(x, y, Phaser.Utils.Array.GetRandom(SYMBOL_KEYS)).setDisplaySize(LAYOUT.REEL_WIDTH-15, LAYOUT.SYMBOL_HEIGHT-15).setDepth(3).setMask(gridMask);
                
                s.originalX = x; s.originalY = y; s.rowIndex = row; 
                this.symbols[reel][row] = s;
            }
        }

        this.add.text(width/2, 80, 'SuperAce', { font: 'bold 48px Arial', fill: '#FFD700', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(50); 
        this.noticeLabel = this.add.text(width, 140, "Welcome!", { font: '20px Arial', fill: '#0F0', backgroundColor: '#000' }).setOrigin(0, 0.5).setDepth(50);
        this.tweens.add({ targets: this.noticeLabel, x: -600, duration: 12000, repeat: -1 });
        
        this.fetchSettings();

        // Sound Button
        this.soundBtn = this.add.image(width-40, 80, 'sound_on').setDisplaySize(50, 50).setInteractive({useHandCursor:true}).setDepth(50);
        this.soundWaves = this.add.text(width-70, 80, ')))', {fontSize: '20px', fill: '#0F0'}).setOrigin(1, 0.5).setDepth(50);
        
        // 🔥 Fix 2: Sound Toggle Check
        this.soundBtn.on('pointerdown', () => { 
            this.soundEnabled = !this.soundEnabled; 
            this.sound.mute = !this.soundEnabled; 
            // Make sure 'sound_off.png' exists in assets!
            this.soundBtn.setTexture(this.soundEnabled ? 'sound_on' : 'sound_off'); 
            this.soundWaves.setVisible(this.soundEnabled);
        });

        const multBG = this.add.graphics();
        multBG.fillStyle(0x000000, 0.6); 
        multBG.fillRect(width/2 - 150, 160, 300, 40);
        multBG.setDepth(49);
        this.multTexts = [];
        MULTIPLIER_LEVELS.forEach((l, i) => {
            const t = this.add.text((width/2-120)+i*80, 180, `x${l}`, { font: 'bold 28px Arial', fill: '#555' }).setOrigin(0.5).setDepth(50);
            this.multTexts.push(t);
        });
        this.updateMultiplierUI();

        const uiY = height - 100; 
        this.spinButton = this.add.image(width/2, uiY, 'bet_button').setScale(0.08).setInteractive().setDepth(52);
        this.spinButton.on('pointerdown', this.startSpin, this);
        this.add.text(width/2, uiY, 'SPIN', { font: 'bold 18px Arial', fill: '#FFD700' }).setOrigin(0.5).setDepth(53);

        this.add.image(width-80, uiY-60, 'plus_button').setScale(0.35).setInteractive().setDepth(52).on('pointerdown', () => this.adjustBet(1));
        this.add.image(width-80, uiY+60, 'minus_button').setScale(0.35).setInteractive().setDepth(52).on('pointerdown', () => this.adjustBet(-1));
        
        this.betAdjustText = this.add.text(width-80, uiY+5, `Tk ${this.currentBet}`, { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5).setDepth(52);
        this.balanceText = this.add.text(20, height-40, `Tk ${this.balance.toFixed(2)}`, { fontSize: '20px', fill: '#FFF' }).setDepth(52);
        
        this.menuButton = this.add.text(20, 40, '≡', { fontSize: '50px', fill: '#FFF' }).setOrigin(0, 0.5).setInteractive().setDepth(1000); 
        this.menuButton.on('pointerdown', this.toggleMenu, this);

        this.centerWinText = this.add.text(width/2, height/2, '', { font: 'bold 60px Arial', fill: '#FF0', stroke:'#F00', strokeThickness:8 }).setOrigin(0.5).setVisible(false).setDepth(100);

        this.createMenuBar(width, height);
        this.time.addEvent({ delay: 5000, callback: this.refreshUserData, callbackScope: this, loop: true });
    }

    fetchSettings() { 
        fetch('/api/settings').then(r=>r.json()).then(d => {
            this.noticeLabel.setText(d.notice);
            if(d.winRate !== undefined) this.currentWinRate = d.winRate;
        }); 
    }
    
    refreshUserData() { 
        if(this.isSpinning) return; 
        fetch(`/api/user-data?username=${this.currentUser.username}`).then(r=>r.json()).then(d=>{ 
            if(d.success) { 
                this.balance = d.balance; 
                this.currentUser.myCode = d.myCode; 
                this.updateUI(); 
                if(d.isBanned) location.reload(); 
            } 
        }); 
    }

    updateMultiplierUI() {
        this.multTexts.forEach((t, i) => {
            if (i < this.winStreak) {
                t.setFill('#FFD700'); 
                t.setFontSize(34);
            } else {
                t.setFill('#555'); 
                t.setFontSize(28);
            }
        });
    }

    getSpinResult() {
        const grid = Array.from({length:REEL_COUNT},()=>[]);
        let effectiveWinRate = this.currentWinRate;
        if (this.superWinSpinsLeft > 0) {
            effectiveWinRate = 40;
            this.superWinSpinsLeft--;
        }

        const isWin = (Phaser.Math.Between(1,100) <= effectiveWinRate); 
        const winSym = isWin ? Phaser.Utils.Array.GetRandom(SYMBOL_KEYS) : null;
        const winRow = isWin ? Phaser.Math.Between(0, ROW_COUNT-1) : -1;
        const match = isWin ? Phaser.Math.Between(3, REEL_COUNT) : 0;
        
        for (let c=0; c<REEL_COUNT; c++) {
            for (let r=0; r<ROW_COUNT; r++) {
                if (isWin && r===winRow && c < match) grid[c][r] = winSym;
                else {
                    let s; 
                    do { s = Phaser.Utils.Array.GetRandom(SYMBOL_KEYS); } while(c>=2 && s===grid[c-1][r] && s===grid[c-2][r]);
                    grid[c][r] = s;
                }
            }
        }
        return grid;
    }

    startSpin() {
        if (this.balance < this.currentBet) { alert('Insufficient Balance!'); this.showDepositPanel(); return; }
        if (this.isSpinning) return; 
        
        this.isSpinning = true; 
        this.spinButtonTween = this.tweens.add({ targets: this.spinButton, angle: 360, duration: 500, repeat: -1 });
        this.centerWinText.setVisible(false);

        fetch('/api/update-balance', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:this.currentUser.username, amount: -this.currentBet}) })
        .then(r=>r.json()).then(d => {
            if(d.success) {
                this.balance = d.newBalance; 
                this.updateUI();
                try { this.sound.play('spin_start'); } catch(e){} 
                
                const result = this.getSpinResult();
                this.reelsStopped = 0;
                
                for (let reel=0; reel<REEL_COUNT; reel++) {
                    for (let row=0; row<ROW_COUNT; row++) {
                        const s = this.symbols[reel][row];
                        this.tweens.add({
                            targets: s, y: s.y - SYMBOL_SHIFT_COUNT*(LAYOUT.SYMBOL_HEIGHT+LAYOUT.GAP), duration: SPIN_DURATION_PER_REEL*(reel*1.5+4), ease: 'Quad.easeOut',
                            onUpdate: (t, tg) => { 
                                if(Math.random()>0.5) tg.setTexture(Phaser.Utils.Array.GetRandom(SYMBOL_KEYS)); 
                                tg.setDisplaySize(LAYOUT.REEL_WIDTH-15, LAYOUT.SYMBOL_HEIGHT-15);
                            },
                            onComplete: (t, tg) => {
                                const trg = tg[0]; 
                                trg.setTexture(result[reel][trg.rowIndex]); 
                                trg.y = LAYOUT.START_Y + trg.rowIndex*(LAYOUT.SYMBOL_HEIGHT+LAYOUT.GAP);
                                trg.setDisplaySize(LAYOUT.REEL_WIDTH-15, LAYOUT.SYMBOL_HEIGHT-15);
                                if(trg.rowIndex === ROW_COUNT-1) this.stopReel();
                            }
                        });
                    }
                }
            }
        });
    }

    stopReel() {
        this.reelsStopped++; try { this.sound.play('reel_stop'); } catch(e){}
        if (this.reelsStopped === REEL_COUNT) {
            this.isSpinning = false; 
            
            if(this.spinButtonTween) this.spinButtonTween.stop();
            this.spinButton.angle = 0;

            const grid = this.symbols.map(r => r.map(s => s.texture.key));
            const win = this.checkWin(grid);
            
            if (win > 0) {
                this.winStreak++;
                if (this.winStreak >= 4) { 
                    this.superWinSpinsLeft = 10; 
                    this.centerWinText.setText("SUPER WIN MODE!").setVisible(true);
                }
                this.updateMultiplierUI();

                try { this.sound.play('win_sound'); } catch(e){}
                this.showWinAnimation(win);
                
                if(win > this.currentBet * 5) this.startCoinRain();
                
                fetch('/api/update-balance', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:this.currentUser.username, amount: win}) })
                .then(r=>r.json()).then(d => { this.balance = d.newBalance; this.updateUI(); });
            } else {
                this.winStreak = 0;
                this.updateMultiplierUI();
            }
        }
    }

    startCoinRain() {
        const emitter = this.coinParticles.createEmitter({
            x: { min: 0, max: GAME_WIDTH },
            y: -50,
            lifespan: 1500, 
            speedY: { min: 300, max: 600 },
            scale: { start: 0.08, end: 0.08 },
            quantity: 1, 
            frequency: 100,
            rotate: { min: 0, max: 360 }
        });
        this.time.delayedCall(2000, () => emitter.stop());
    }

    showWinAnimation(amount) {
        this.centerWinText.setText(`WIN: Tk ${amount}`).setVisible(true).setScale(0);
        this.tweens.add({ targets: this.centerWinText, scale: 1.2, duration: 300, yoyo: true, repeat: 2 });
        this.time.delayedCall(3000, () => this.centerWinText.setVisible(false));
    }

    checkWin(grid) {
        let total = 0;
        for (let r=0; r<ROW_COUNT; r++) {
            let sym = grid[0][r], m = 1;
            for (let c=1; c<REEL_COUNT; c++) { if (grid[c][r] === sym) m++; else break; }
            if (m >= 3) {
                let mult = MULTIPLIER_LEVELS[Math.min(this.winStreak, 3)]; 
                total += this.currentBet * SYMBOL_VALUES[sym] * (m-2) * mult;
            }
        }
        return total;
    }

    createMenuBar(w, h) {
        const c = this.add.container(-350, 0).setDepth(999); this.menuBar = c;
        c.add(this.add.rectangle(0, h/2, 350, h, 0x111111).setOrigin(0, 0.5).setStrokeStyle(2, 0xFFD700));
        c.add(this.add.text(175, 60, 'PROFILE', { fontSize: '40px', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5));
        
        this.menuBalance = this.add.text(175, 120, `Bal: Tk ${this.balance.toFixed(2)}`, { fontSize: '20px', fill: '#FFF' }).setOrigin(0.5);
        c.add(this.menuBalance);
        
        const refCode = this.add.text(175, 150, `Ref: ${this.currentUser.myCode || 'N/A'}`, { fontSize: '18px', fill: '#0F0' }).setOrigin(0.5);
        c.add(refCode);

        let y = 200;
        const btns = [
            {t: 'DEPOSIT', c: 0x00FF00, cb: ()=>this.showDepositPanel()},
            {t: 'WITHDRAW', c: 0xFFA500, cb: ()=>this.showWithdrawPanel()},
            {t: 'HISTORY', c: 0x00AAFF, cb: ()=>this.showHistoryPanel()},
            {t: 'GAME RULES', c: 0xFFFFFF, cb: ()=>this.showRulesPanel()},
            {t: 'REFER & EARN', c: 0xE2136E, cb: ()=>this.showReferralInfo()}
        ];
        btns.forEach(b => { c.add(this.createGlossyBtn(175, y, b.t, b.c, b.cb)); y+=70; });

        if(this.isAdmin) {
            c.add(this.add.text(175, y+20, 'DASHBOARD', {fontSize:'24px', fill:'#F00'}).setOrigin(0.5)); y+=60;
            c.add(this.createGlossyBtn(175, y, 'ADMIN PANEL', 0x555555, ()=>this.showAdminDashboard())); y+=80;
        }
        c.add(this.createGlossyBtn(175, h-80, 'LOGOUT', 0xFF0000, ()=>location.reload()));
    }

    createGlossyBtn(x, y, text, color, cb) {
        const bg = this.add.rectangle(0, 0, 220, 55, color).setInteractive({useHandCursor:true});
        const txt = this.add.text(0, 0, text, { fontSize: '20px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        const c = this.add.container(x, y, [bg, txt]);
        bg.on('pointerdown', () => { 
            this.tweens.add({targets:c, scale:0.9, yoyo:true, duration:50}); 
            this.toggleMenu(); 
            this.time.delayedCall(200, cb); 
        });
        return c;
    }

    // --- DEPOSIT SYSTEM FIX 1: Layout Fix ---
    showDepositPanel() {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(300);
        c.add(this.add.rectangle(0,0,width,height,0x000000,0.8));
        
        // Increased height to 550 to fit buttons
        c.add(this.add.rectangle(0,0,480,550,0xFFFFFF).setStrokeStyle(4, 0x00FF00));
        c.add(this.add.text(0,-230,"DEPOSIT", {fontSize:'32px', fill:'#000', fontStyle:'bold'}).setOrigin(0.5));

        const amtInput = this.createInputBox(0, -130, "Enter Amount (min 50)", c);
        const phnInput = this.createInputBox(0, -60, "Sender Number", c);

        const b1 = this.add.text(0, 30, " bKash Payment ", {fontSize:'24px', backgroundColor:'#E2136E', padding:10}).setOrigin(0.5).setInteractive({useHandCursor:true});
        const b2 = this.add.text(0, 100, " Nagad Payment ", {fontSize:'24px', backgroundColor:'#F58220', padding:10}).setOrigin(0.5).setInteractive({useHandCursor:true});
        
        // Moved History button slightly up
        const hBtn = this.add.text(0, 170, " [ VIEW HISTORY ] ", {fontSize:'20px', backgroundColor:'#00AAFF', padding:5}).setOrigin(0.5).setInteractive({useHandCursor:true});
        hBtn.on('pointerdown', ()=> { c.destroy(); this.showTransactionHistory('Deposit'); });

        const validate = (method, color) => {
            const amount = parseFloat(amtInput.value);
            if (isNaN(amount) || amount < 50 || amount > 5000) return alert("Amount must be between 50 and 5000 Tk!");
            if (!phnInput.value || phnInput.value.length !== 11) return alert("Sender Number must be 11 digits!");
            c.destroy();
            this.showPaymentPage(amount, method, phnInput.value, color);
        };

        b1.on('pointerdown', () => validate('bKash', 0xE2136E));
        b2.on('pointerdown', () => validate('Nagad', 0xF58220));

        c.add([b1, b2, hBtn]);
        
        // 🔥 Moved Close button UP to stay inside the box
        this.addCloseButton(c, ()=>c.destroy(), 230);
    }

    createInputBox(x, y, placeholder, parent, uppercase = false) {
        const bg = this.add.rectangle(x, y, 300, 50, 0xEEEEEE).setStrokeStyle(1, 0x000).setInteractive({useHandCursor:true});
        const txt = this.add.text(x-140, y, placeholder, {fontSize:'18px', fill:'#555'}).setOrigin(0, 0.5);
        const obj = { value: '' };
        bg.on('pointerdown', () => {
            let v = prompt(placeholder);
            if(v) { 
                if(uppercase) v = v.toUpperCase();
                obj.value = v; 
                txt.setText(v).setFill('#000'); 
            }
        });
        parent.add([bg, txt]);
        return obj;
    }

    showPaymentPage(amount, method, sender, color) {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(300);
        c.add(this.add.rectangle(0,0,width,height,0x000000,0.9));
        c.add(this.add.rectangle(0,0,480,650,0xFFFFFF).setStrokeStyle(5, color));

        c.add(this.add.text(0,-280, `${method} PAYMENT`, {fontSize:'30px', fill: color==0xE2136E?'#E2136E':'#F58220', fontStyle:'bold'}).setOrigin(0.5));
        c.add(this.add.text(0,-220, `Amount: Tk ${amount}`, {fontSize:'24px', fill:'#000'}).setOrigin(0.5));

        const numList = method === 'bKash' ? PAYMENT_NUMBERS.bkash : PAYMENT_NUMBERS.nagad;
        const index = new Date().getHours() % numList.length;
        const targetNum = numList[index];

        c.add(this.add.text(0, -150, "Send Money To:", {fontSize:'20px', fill:'#555'}).setOrigin(0.5));
        const numTxt = this.add.text(0, -110, targetNum, {fontSize:'35px', fill: color==0xE2136E?'#E2136E':'#F58220', fontStyle:'bold', backgroundColor:'#EEE'}).setOrigin(0.5);
        
        const copyBtn = this.add.text(0, -60, " [ COPY NUMBER ] ", {fontSize:'18px', backgroundColor:'#000', fill:'#FFF'}).setOrigin(0.5).setInteractive({useHandCursor:true});
        copyBtn.on('pointerdown', () => {
            navigator.clipboard.writeText(targetNum);
            alert("Number Copied!");
        });

        const trxInput = this.createInputBox(0, 50, "Enter TrxID", c, true);
        
        const subBtn = this.add.text(0, 150, " SUBMIT REQUEST ", {fontSize:'26px', backgroundColor:'#00AA00', padding:10}).setOrigin(0.5).setInteractive({useHandCursor:true});
        subBtn.on('pointerdown', () => {
            if(!trxInput.value) return alert("Please Enter TrxID!");
            fetch('/api/transaction', { 
                method:'POST', 
                headers:{'Content-Type':'application/json'}, 
                body:JSON.stringify({ type:'Deposit', method, amount: parseFloat(amount), phone: sender, trx: trxInput.value, username:this.currentUser.username }) 
            })
            .then(r=>r.json()).then(d=>{ alert(d.message); c.destroy(); });
        });

        c.add([numTxt, copyBtn, subBtn]);
        this.addCloseButton(c, ()=>c.destroy(), 250);
    }

    // --- ADMIN PANEL ---
    showAdminDashboard() {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(2000); 
        c.add(this.add.rectangle(0, 0, 500, 800, 0x111111).setStrokeStyle(3, 0xFFD700));
        c.add(this.add.text(0, -360, "ADMIN CONTROL", { fontSize: '32px', fill: '#FFD700' }).setOrigin(0.5));
        this.addCloseButton(c, ()=>c.destroy(), 350);

        let y = -250;
        const tools = [
            {t:'USER MANAGEMENT', cb:()=>this.showUserListPanel()},
            {t:'DEPOSIT REQS', cb:()=>this.showAdminRequestsPanel('Deposit')},
            {t:'WITHDRAW REQS', cb:()=>this.showAdminRequestsPanel('Withdraw')},
            {t:'GAME EDIT', cb:()=>this.showGameEditPanel()} 
        ];
        tools.forEach(t => { c.add(this.createGlossyBtn(0, y, t.t, 0xFFFFFF, t.cb)); y+=80; });
    }

    showGameEditPanel() {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(2100);
        c.add(this.add.rectangle(0, 0, 500, 600, 0x222222).setStrokeStyle(2, 0xFFD700));
        c.add(this.add.text(0, -250, "GAME SETTINGS", { fontSize: '28px', fill: '#FFD700' }).setOrigin(0.5));
        this.addCloseButton(c, ()=>c.destroy(), 250);

        let y = -150;
        const rateTxt = this.add.text(0, y, `WIN RATE: ${this.currentWinRate}%`, {fontSize:'24px', fill:'#0F0'}).setOrigin(0.5);
        const btnMinus = this.add.text(-120, y, " [-] ", {fontSize:'24px', backgroundColor:'#F00'}).setOrigin(0.5).setInteractive({useHandCursor:true});
        const btnPlus = this.add.text(120, y, " [+] ", {fontSize:'24px', backgroundColor:'#0A0'}).setOrigin(0.5).setInteractive({useHandCursor:true});
        
        const updateRate = (n) => {
            let newRate = this.currentWinRate + n;
            if(newRate < 0) newRate = 0; if(newRate > 100) newRate = 100;
            fetch('/api/admin/update-winrate', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({winRate:newRate})})
            .then(()=>{ this.currentWinRate = newRate; rateTxt.setText(`WIN RATE: ${newRate}%`); });
        };
        btnMinus.on('pointerdown', () => updateRate(-10));
        btnPlus.on('pointerdown', () => updateRate(10));
        c.add([rateTxt, btnMinus, btnPlus]);

        y += 100;
        const noticeBtn = this.add.text(0, y, " UPDATE NOTICE ", {fontSize:'22px', backgroundColor:'#333', padding:10}).setOrigin(0.5).setInteractive({useHandCursor:true});
        noticeBtn.on('pointerdown', () => {
            const n = prompt("Enter new scrolling notice:");
            if(n) fetch('/api/admin/update-notice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notice:n})}).then(()=>alert("Done"));
        });
        c.add(noticeBtn);
    }

    showUserListPanel() { 
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(2100);
        c.add(this.add.rectangle(0, 0, 520, 800, 0x222222).setStrokeStyle(2, 0xFFD700));
        c.add(this.add.text(0, -350, "USER LIST (Click for Details)", { fontSize: '24px', fill: '#FFD700' }).setOrigin(0.5));
        this.addCloseButton(c, ()=>c.destroy(), 350);
        
        fetch('/api/admin/users').then(r=>r.json()).then(users => {
            let y = -280;
            users.slice(0, 8).forEach(u => {
                if(u.username === 'admin') return;
                const btn = this.add.text(0, y, `${u.username} | Tk ${u.balance}`, { fontSize: '20px', fill: '#FFF', backgroundColor: '#333', padding: 10 }).setOrigin(0.5).setInteractive({useHandCursor:true});
                btn.on('pointerdown', () => this.showUserDetails(u.username));
                c.add(btn); y += 60;
            });
        });
    }

    showUserDetails(username) {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(2200);
        c.add(this.add.rectangle(0, 0, 500, 700, 0x000000).setStrokeStyle(3, 0x00AAFF));
        c.add(this.add.text(0, -300, `USER: ${username}`, { fontSize: '28px', fill: '#00AAFF', fontStyle: 'bold' }).setOrigin(0.5));
        
        fetch(`/api/admin/user-details?username=${username}`).then(r=>r.json()).then(d => {
            if(!d.success) return alert("Error fetching data");
            const u = d.user;
            const info = `Mobile: ${u.mobile}\nBalance: ${u.balance}\nTotal Deposit: ${u.totalDeposit}\nTotal Withdraw: ${u.totalWithdraw}\nTotal Bet: ${u.totalBet}\nTotal Win: ${u.totalWin}\nStatus: ${u.isBanned ? 'BANNED' : 'ACTIVE'}`;
            c.add(this.add.text(0, -50, info, { fontSize: '20px', fill: '#FFF', align: 'center' }).setOrigin(0.5));
            const banBtn = this.add.text(0, 200, u.isBanned ? " UNBAN USER " : " BAN USER ", { fontSize: '24px', backgroundColor: u.isBanned ? '#0A0' : '#F00', padding: 10 }).setOrigin(0.5).setInteractive({useHandCursor:true});
            banBtn.on('pointerdown', () => { fetch('/api/admin/ban-user', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username: u.username, banStatus: !u.isBanned })}).then(()=>{ alert("Status Updated"); c.destroy(); }); });
            c.add(banBtn);
        });
        this.addCloseButton(c, ()=>c.destroy(), 300);
    }

    showWithdrawPanel() { 
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(300);
        c.add(this.add.rectangle(0,0,width,height,0x000000,0.8));
        c.add(this.add.rectangle(0,0,480,500,0xFFFFFF).setStrokeStyle(4, 0xFFA500));
        c.add(this.add.text(0,-200,"WITHDRAW", {fontSize:'32px', fill:'#000', fontStyle:'bold'}).setOrigin(0.5));

        const b1 = this.add.text(0, 0, " REQUEST WITHDRAW ", {fontSize:'24px', backgroundColor:'#00AA00', padding:10}).setOrigin(0.5).setInteractive({useHandCursor:true});
        b1.on('pointerdown', () => { c.destroy(); this.showPaymentModal('WITHDRAW', 0xE2136E, 0xF58220); }); 

        const hBtn = this.add.text(0, 100, " [ VIEW HISTORY ] ", {fontSize:'20px', backgroundColor:'#00AAFF', padding:5}).setOrigin(0.5).setInteractive({useHandCursor:true});
        hBtn.on('pointerdown', ()=> { c.destroy(); this.showTransactionHistory('Withdraw'); });

        c.add([b1, hBtn]);
        this.addCloseButton(c, ()=>c.destroy(), 220);
    }

    showTransactionHistory(type) {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(600);
        c.add(this.add.rectangle(0,0,480,700,0x111111).setStrokeStyle(2,0xFFFFFF));
        c.add(this.add.text(0,-320,`${type} HISTORY`, {fontSize:'28px',fill:'#FFF'}).setOrigin(0.5));
        this.addCloseButton(c, ()=>c.destroy(), 320);

        fetch(`/api/user-transactions?username=${this.currentUser.username}&type=${type}`)
        .then(r=>r.json()).then(data => {
            if(data.length === 0) return c.add(this.add.text(0,0,"No Records", {fontSize:'20px', fill:'#888'}).setOrigin(0.5));
            let y = -250;
            data.forEach(t => {
                let color = '#FFF';
                if(t.status === 'Success') color = '#0F0';
                if(t.status === 'Failed') color = '#F00';
                if(t.status === 'Pending') color = '#FF0';
                const date = new Date(t.date).toLocaleDateString();
                c.add(this.add.text(-220, y, `${date} | ${t.amount} | ${t.status}`, {fontSize:'18px', fill:color}));
                y += 40;
            });
        });
    }
    
    showAdminRequestsPanel(type) {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(2100);
        c.add(this.add.rectangle(0, 0, 520, 800, 0x222222).setStrokeStyle(2, 0xFFD700));
        c.add(this.add.text(0, -350, `${type} REQ`, { fontSize: '28px', fill: '#FFD700' }).setOrigin(0.5));
        this.addCloseButton(c, ()=>c.destroy(), 350);
        fetch('/api/admin/transactions').then(r=>r.json()).then(data => {
            const list = data.filter(t => t.status === 'Pending' && t.type === type);
            if(list.length === 0) return c.add(this.add.text(0, 0, "No Requests", { fontSize: '20px', fill: '#AAA' }).setOrigin(0.5));
            let y = -250;
            list.slice(0, 6).forEach(req => {
                c.add(this.add.text(-230, y, `${req.username} | ${req.amount}`, { fontSize: '18px', fill: '#FFF' }));
                const ok = this.add.text(100, y, "✔", { fontSize: '24px', backgroundColor: '#0A0', padding: 5 }).setInteractive({useHandCursor:true}).on('pointerdown', () => this.handleAdminAction(req.trx||req.phone, 'approve', req, c, type));
                const no = this.add.text(160, y, "X", { fontSize: '24px', backgroundColor: '#F00', padding: 5 }).setInteractive({useHandCursor:true}).on('pointerdown', () => this.handleAdminAction(req.trx||req.phone, 'reject', req, c, type));
                c.add([ok, no]); y += 80;
            });
        });
    }
    
    handleAdminAction(id, action, req, panel, type) { fetch('/api/admin/action', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ trxId: id, action, type: req.type, amount: req.amount, username: req.username }) }).then(() => { panel.destroy(); this.showAdminRequestsPanel(type); }); }

    showHistoryPanel() {
        const { width, height } = this.scale;
        const c = this.add.container(width/2, height/2).setDepth(600);
        c.add(this.add.rectangle(0,0,480,700,0x111111).setStrokeStyle(2,0xFFFFFF));
        c.add(this.add.text(0,-320,"BETTING HISTORY", {fontSize:'28px',fill:'#FFF'}).setOrigin(0.5));
        this.addCloseButton(c, ()=>c.destroy(), 320);
        fetch(`/api/history?username=${this.currentUser.username}`).then(r=>r.json()).then(d => {
            let y=-250;
            d.forEach(h=>{
                const color = h.result === 'WIN' ? '#0F0' : '#F00';
                c.add(this.add.text(-200,y,`${h.result} | Bet: ${h.betAmount} | Got: ${h.winAmount}`,{fontSize:'16px',fill:color}));
                y+=40;
            });
        });
    }

    showReferralInfo() { this.showInfoPanel("REFERRAL SYSTEM", `Your Code: ${this.currentUser.myCode}\n\n1. Share code with friends.\n2. You get 200 Tk Bonus!\n3. 10% commission on deposit!`); }
    showRulesPanel() { this.showInfoPanel("GAME RULES", `1. Valid Bkash/Nagad number.\n2. Min Deposit: 50\n3. Min Withdraw: 100\n4. No fake TrxID.\n5. Server decision is final.`); }
    addCloseButton(c, cb, y) { const b = this.add.text(0, y, "CLOSE", { fontSize: '24px', fill: '#FFF', backgroundColor: '#F00', padding: 10 }).setOrigin(0.5).setInteractive({useHandCursor:true}); b.on('pointerdown', cb); c.add(b); }
    showInfoPanel(t, content) { alert(`${t}\n\n${content}`); }
    updateUI() { if(this.balanceText) this.balanceText.setText(`Tk ${this.balance.toFixed(2)}`); if(this.menuBalance) this.menuBalance.setText(`Bal: Tk ${this.balance.toFixed(2)}`); if(this.betAdjustText) this.betAdjustText.setText(`Tk ${this.currentBet}`); }
    adjustBet(n) { let b=this.currentBet+n; if(b>=1 && b<=1000){this.currentBet=b; this.updateUI();} }
    toggleMenu() { this.isMenuOpen=!this.isMenuOpen; this.tweens.add({targets:this.menuBar, x:this.isMenuOpen?0:-350, duration:300}); }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [PreloadScene, LoginScene, GameScene]
};

const game = new Phaser.Game(config);
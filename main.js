const standard_width=1247;
let gameWidth;
let gameHeight;
let card_width_aspect;
let deck = [];
let how_many_card=0;
let playerID; // プレイヤーの識別子
let roomName;

// Socket.IOサーバーへの接続
socket = io.connect('http://localhost:3000');

socket.on('playerConnected', (player) => {
    console.log(`Player ${player} connected`);
    
    // プレイヤーの識別子を設定
    playerID = player;

    // ここに必要な初期化などの処理を追加
});



class Card extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture,suit,rank,canvasWidth,canvasHeight) {
        super(scene, x, y, texture);
        const card_width=canvasWidth/standard_width;
        this.setScale(card_width*0.20);

        
        //this.setDisplaySize(card_width,card_height );
        // カードをクリック可能にする
        this.setInteractive();

        // グラフィックスオブジェクトを初期化
        this.graphics = scene.add.graphics();

        // クリック時の処理
        this.on('pointerdown', function (pointer) {
            // クリックされたときの処理
            console.log("number: "+this.rank);
            console.log("change_flg: "+this.change_flg);
            this.change_flg^=1;//XOR演算
            console.log("change_flg: "+this.change_flg);
            console.log(this.width+" , "+this.height);
            this.showFrame();
            socket.emit('cardClicked', { suit: this.suit,rank: this.rank, change_flg: this.change_flg });
        });

        // カードをシーンに追加
        scene.add.existing(this);

        this.suit=suit;
        this.rank=rank;
        this.change_flg=0;

    }

    showFrame() {
        // 赤い枠線を表示
        if(this.change_flg==1){
            this.graphics.lineStyle(2, 0xff0000);
            this.graphics.strokeRect(this.x - this.displayWidth / 2, this.y - this.displayHeight / 2, this.displayWidth, this.displayHeight);
        }else{
            this.hideFrame()
        }
       
    }

    hideFrame() {
        // 枠線をクリア
        this.graphics.clear();
    }
    destroyCard() {
        // カードが破棄されたときに呼ばれるメソッド
        this.graphics.clear();
        this.destroy();
    }
}

class Card_Change_Button extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style) {
        super(scene, x, y, text, style);

        // ボタンに対するインタラクティブな機能を有効にする
        this.setInteractive();

        // ボタンがクリックされた時のイベントリスナーを追加
        this.on('pointerdown', () => {
            console.log(`${this.text} Clicked!`);
            // myhandsをループしてchange_flgを確認
            for (let i = 0; i < myhands.length; i++) {
                console.log(`Card ${i + 1}: ${myhands[i].change_flg}`);
                if(myhands[i].change_flg==1){
                    // カードのインスタンスを削除
                    myhands[i].destroyCard();
                    // myhandsから削除
                    myhands.splice(i, 1);
                    const card = new Card(scene,card_width_aspect*(100+150*i), 450, cardImages[deck[how_many_card].suit][deck[how_many_card].rank],deck[how_many_card].suit,deck[how_many_card].rank,gameWidth,gameHeight);
                    how_many_card++;
                    myhands.splice(i,0,card);
                }
            }
            // enemyhandsをループしてchange_flgを確認
            for (let i = 0; i < enemyhands.length; i++) {
                console.log(`Card ${i + 1}: ${enemyhands[i].change_flg}`);
                if(enemyhands[i].change_flg==1){
                    // カードのインスタンスを削除
                    enemyhands[i].destroyCard();
                    // myhandsから削除
                    enemyhands.splice(i, 1);
                    const card = new Card(scene,card_width_aspect*(100+150*i), 100, cardImages[deck[how_many_card].suit][deck[how_many_card].rank],deck[how_many_card].suit,deck[how_many_card].rank,gameWidth,gameHeight);
                    how_many_card++;
                    enemyhands.splice(i,0,card);
                }
            }

            let myhands_copy=[];
            let enemyhands_copy=[];
            for(let i=0;i<5;i++){
                myhands_copy[i]=myhands[i];
                enemyhands_copy[i]=enemyhands[i];
            }

            // 手札を判定
            const myHandRank = evaluatePokerHand(myhands_copy);
            const enemyHandRank = evaluatePokerHand(enemyhands_copy);

            console.log('My Hand:', myHandRank);
            console.log('Enemy Hand:', enemyHandRank);
            // 勝敗を判定する
            const result = determineWinner(myHandRank, enemyHandRank);
            console.log(result);
        });

        // ボタンの配置を中央に調整
        Phaser.Display.Align.In.Center(this, scene.add.zone(x, y, 1, 1));
        
        // ボタンをシーンに追加
        scene.add.existing(this);
    }
}



const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container', // プレースホルダーのIDを指定
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    scene: {
        preload: preload,
        create: create
    }
};


let game = new Phaser.Game(config);

let cardImages = { s: [null], c: [null], d: [null], h: [null] };
let myhands=[];
let enemyhands=[];

function preload() {
    // トランプの画像を読み込む
    for (let i = 1; i <= 54; i++) {
        this.load.image(`card${i}`, `card-image/torannpu-illust${i}.png`);
    }
}

function create() {
    


    // ゲーム画面の幅と高さを取得
    gameWidth = this.sys.game.canvas.width;
    gameHeight = this.sys.game.canvas.height;
    console.log(`ゲーム画面の幅: ${gameWidth}, 高さ: ${gameHeight}`);

    // ロードした画像を配列に格納
    for (let i = 1; i <= 13; i++) {
        cardImages['s'].push(`card${i}`);
    }
    for (let i = 14; i <= 26; i++) {
        cardImages['c'].push(`card${i}`);
    }
    for (let i = 27; i <= 39; i++) {
        cardImages['d'].push(`card${i}`);
    }
    for (let i = 40; i <= 52; i++) {
        cardImages['h'].push(`card${i}`);
    }

    // カードの組み合わせを生成
    const suits = ['s', 'c', 'd', 'h'];
    const ranks = Array.from({ length: 13 }, (_, index) => index + 1);

    // deckに(s,1)~(s,13),(c,1)~(c,13),(d,1)~(d,13),(h,1)~(h,13)をランダムに格納
    

    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }

    shuffleArray(deck);

    console.log(deck);

    card_width_aspect=gameWidth/standard_width;
   

    for(let i=0;i<=4;i++){
    // カードを生成
    const card = new Card(this,card_width_aspect*(100+150*i), 450, cardImages[deck[how_many_card].suit][deck[how_many_card].rank],deck[how_many_card].suit,deck[how_many_card].rank,gameWidth,gameHeight);
    //myhands.push({suit: deck[how_many_card].suit,rank: deck[how_many_card].rank });
    myhands.push(card);
    how_many_card++;
    }
    console.log(myhands);
    console.log(myhands[0].suit);
    for(let i=0;i<=4;i++){
        // カードを生成
        const card = new Card(this,card_width_aspect*(100+150*i), 100, cardImages[deck[how_many_card].suit][deck[how_many_card].rank],deck[how_many_card].suit,deck[how_many_card].rank,gameWidth,gameHeight);
        //enemyhands.push({suit: deck[how_many_card].suit,rank: deck[how_many_card].rank });
        enemyhands.push(card);
        how_many_card++;
    }
    console.log(enemyhands);


    const buttonSize = `${card_width_aspect * 50}px`;
     // ボタンのスタイルを設定
    const buttonStyle = { color: '#ffffff', fontSize: buttonSize };

     // ボタンを作成
    const buttonText = new Card_Change_Button(this, card_width_aspect*(100+150*2), 300, 'Click Me', buttonStyle);




}



function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// カードの役を表す列挙型
const PokerHand = {
    HIGH_CARD: 'High Card',
    ONE_PAIR: 'One Pair',
    TWO_PAIR: 'Two Pair',
    THREE_OF_A_KIND: 'Three of a Kind',
    STRAIGHT: 'Straight',
    FLUSH: 'Flush',
    FULL_HOUSE: 'Full House',
    FOUR_OF_A_KIND: 'Four of a Kind',
    STRAIGHT_FLUSH: 'Straight Flush',
    ROYAL_FLUSH: 'Royal Flush',
};

const PokerHandRank = {
  'High Card': 0,
  'One Pair': 1,
  'Two Pair': 2,
  'Three of a Kind': 3,
  'Straight': 4,
  'Flush': 5,
  'Full House': 6,
  'Four of a Kind': 7,
  'Straight Flush': 8,
  'Royal Flush': 9,
};

// 手札の役を判定する関数
function evaluatePokerHand(cards) {
    // カードをランクでソート
    cards.sort((a, b) => a.rank - b.rank);

    // 同じスートの枚数を格納するオブジェクト
    const suitCount = {};

    // 同じランクの枚数を格納するオブジェクト
    const rankCount = {};

    // ストレートを判定するフラグ
    let isStraight = true;

    // ストレートフラッシュを判定するフラグ
    let isStraightFlush = true;

    // ロイヤルフラッシュを判定するフラグ
    let isRoyalFlush = false;

    // 同じスートのカードの枚数と同じランクのカードの枚数を数える
    for (const card of cards) {
        suitCount[card.suit] = (suitCount[card.suit] || 0) + 1;
        rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
    }

    // ストレートとストレートフラッシュの判定
    for (let i = 1; i < cards.length; i++) {
        if (cards[i].rank !== cards[i - 1].rank + 1) {
            isStraight = false;
        }

        if (cards[i].suit !== cards[i - 1].suit) {
            isStraightFlush = false;
        }
    }

    // ロイヤルフラッシュの判定
    if (isStraightFlush && cards[0].rank === 1 && cards[cards.length - 1].rank === 13) {
        isRoyalFlush = true;
    }

    // 同じランクのカードの枚数に基づいて役を判定
    const rankValues = Object.values(rankCount);

    if (isRoyalFlush) {
        return PokerHand.ROYAL_FLUSH;
    } else if (isStraightFlush) {
        return PokerHand.STRAIGHT_FLUSH;
    } else if (rankValues.includes(4)) {
        return PokerHand.FOUR_OF_A_KIND;
    } else if (rankValues.includes(3) && rankValues.includes(2)) {
        return PokerHand.FULL_HOUSE;
    } else if (suitCount[cards[0].suit] === cards.length) {
        return PokerHand.FLUSH;
    } else if (isStraight) {
        return PokerHand.STRAIGHT;
    } else if (rankValues.includes(3)) {
        return PokerHand.THREE_OF_A_KIND;
    } else if (rankValues.filter((count) => count === 2).length === 2) {
        return PokerHand.TWO_PAIR;
    } else if (rankValues.includes(2)) {
        return PokerHand.ONE_PAIR;
    } else {
        return PokerHand.HIGH_CARD;
    }
}

function determineWinner(myrole,enemyrole) {
    let myHandRank=PokerHandRank[myrole];
    let enemyHandRank=PokerHandRank[enemyrole];
    //console.log(PokerHandRank[myrole]);
    if (myHandRank > enemyHandRank) {
        return "Player wins!";
    } else if (myHandRank < enemyHandRank) {
        return "Enemy wins!";
    } else {
        return "It's a tie!";
    }
}
const standard_width=1247;
let gameWidth;
let gameHeight;
let card_width_aspect;
let playerID; // プレイヤーの識別子
let roomName;
let myhands=[];
let opponentHands=[];
let rooms=[]


// Socket.IOサーバーへの接続
socket = io.connect('http://localhost:3000');

socket.on('playerConnected', (player) => {
    console.log(`Player ${player} connected`);
    
    // プレイヤーの識別子を設定
    playerID = player;

});




class Card extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture,suit,rank,canvasWidth,canvasHeight) {
        super(scene, x, y, texture);
        const card_width=canvasWidth/standard_width;
        this.setScale(card_width*0.20);

        
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
class Card_distribute_Button extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style) {
        super(scene, x, y, text, style);

        // ボタンに対するインタラクティブな機能を有効にする
        this.setInteractive();

        // ボタンがクリックされた時のイベントリスナーを追加
        this.on('pointerdown', () => {
            console.log(`${this.text} Clicked!`);

            socket.emit('distributehands', { playerID, roomName });
        });

        // ボタンの配置を中央に調整
        Phaser.Display.Align.In.Center(this, scene.add.zone(x, y, 1, 1));
        
        // ボタンをシーンに追加
        scene.add.existing(this);
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
            this.destroy();
            // myhandsをループしてchange_flgを確認
            for (let i = 0; i < myhands.length; i++) {
                console.log(`for文Card ${i + 1}: ${myhands[i].change_flg}`);
                if(myhands[i].change_flg==1){
                    let change_suit=myhands[i].suit;
                    let change_rank=myhands[i].rank;
                    socket.emit('changeCard', { playerID, roomName,change_suit,change_rank});
                    console.log("送った"+change_suit+change_rank);
                    socket.on('cardChanged',(data)=>{
                        console.log(data);
                        const { newcard,location } = data;
                        console.log(newcard);
                        console.log(location);
                        console.log("受け取った"+newcard.suit,newcard.rank);
                        // カードのインスタンスを削除
                        myhands[location].destroyCard();
                        // myhandsから削除
                        myhands.splice(location, 1);
                        const card = new Card(scene,card_width_aspect*(100+150*location), 450, cardImages[newcard.suit][newcard.rank],newcard.suit,newcard.rank,gameWidth,gameHeight);
                        myhands.splice(location,0,card);
                    });

                    
                }
            }

            
        });

        // ボタンの配置を中央に調整
        Phaser.Display.Align.In.Center(this, scene.add.zone(x, y, 1, 1));
        
        // ボタンをシーンに追加
        scene.add.existing(this);
    }
}
class Rooms extends Phaser.GameObjects.Text {
    constructor(scene, x, y, roomName, style) {
        super(scene, x, y, roomName, style);

        // ボタンに対するインタラクティブな機能を有効にする
        this.setInteractive();

        // ボタンがクリックされた時のイベントリスナーを追加
        this.on('pointerdown', () => {
            console.log(roomName," Clicked!");

            socket.emit('selectedRoom', { playerID, roomName });
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

    card_width_aspect=gameWidth/standard_width;
   

    const buttonSize = `${card_width_aspect * 50}px`;
     // ボタンのスタイルを設定
    const buttonStyle = { color: '#ffffff', fontSize: buttonSize };

    for(let i=1;i<=5;i++){
    const roombutton = new Rooms(this, card_width_aspect*(100+150*3), 40+20*i,'room'+i,buttonStyle);
    rooms.push(roombutton);
    }

    let distributeButton;
    socket.on('joinedRoom',(room)=>{
        roomName = room;
        console.log(`Player ${room} connected`);
        rooms.forEach(room => {
            if (room.destroy) {
                room.destroy();
            }
        });
        // 配列を空にする
        rooms.length = 0;
         // ボタンを作成
    const Button = new Card_distribute_Button(this, card_width_aspect*(100+150*1), 300, '手札', buttonStyle);
    const changebutton = new Card_Change_Button(this, card_width_aspect*(100+150*4), 300, 'チェンジ', buttonStyle);
    distributeButton=Button;
    });
    // サーバーから手札が配布されたときのイベントリスナー
socket.on('handsDistributed', (hands) => {
    console.log('Received hands:', hands);
    distributeButton.destroy();
    // handsにはサーバーから送られた手札の情報が含まれています。
    // ここで手札を表示するための処理を追加してください。

    for(let i=0;i<hands.length;i++){
        // カードを生成
        const cardInfo = hands[i];
        console.log(cardInfo);
        const card = new Card(this,card_width_aspect*(100+150*i), 450, cardImages[cardInfo.suit][cardInfo.rank],cardInfo.suit, cardInfo.rank,gameWidth,gameHeight);
        console.log(card);
        myhands.push(card);
        }
    console.log(myhands);
});

socket.on('opponentHands', (hands) => {
    console.log('Received opponent hands:', hands);

    // handsにはサーバーから送られた手札の情報が含まれています。
    // ここで手札を表示するための処理を追加してください。

    for(let i=0;i<hands.length;i++){
        // カードを生成
        const cardInfo = hands[i];
        console.log(cardInfo);
        const card = new Card(this,card_width_aspect*(100+150*i), 100, cardImages[cardInfo.suit][cardInfo.rank],cardInfo.suit, cardInfo.rank,gameWidth,gameHeight);
        console.log(card);
        opponentHands.push(card);
        }
    console.log(opponentHands);
});

socket.on('opponentCardChanged',(data)=>{
    console.log("受け取った");
    const { newcard,location } = data;
    //console.log(newcard);
    //console.log(location);
    console.log("受け取った"+newcard.suit,newcard.rank);
    // カードのインスタンスを削除
    opponentHands[location].destroyCard();
    // myhandsから削除
    opponentHands.splice(location, 1);
    const card = new Card(this,card_width_aspect*(100+150*location), 100, cardImages[newcard.suit][newcard.rank],newcard.suit,newcard.rank,gameWidth,gameHeight);
    opponentHands.splice(location,0,card);
});

}

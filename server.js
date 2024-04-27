const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);


const MAX_PLAYERS = 2; // プレイヤーの数
let playerCount = 0;

const path=require('path');
app.use(express.static(path.join(__dirname)));

const gameRooms = {};
for (let i = 1; i <= 5; i++) {
    let roomName = 'room' + i;
    gameRooms[roomName] = { players: [], deck: [] };
}
console.log(gameRooms);
//roomを管理しやすいための表
const room_table =[];

io.on('connection', (socket) => {
    console.log('ユーザーが接続しました');

    // プレイヤーにユニークなIDを割り当てる
    const playerId = socket.id;
    // プレイヤーが接続したことを通知
    io.to(playerId).emit('playerConnected', playerId);

    

    // ゲームルームへの参加
    let joinedRoom = false;
    let roomName;

    socket.on('selectedRoom', (data) => {
        //console.log('Clicked:', data);
        const { playerID, roomName } = data;
        //console.log('Clicked:', playerID);
        if (gameRooms[roomName].players.length < MAX_PLAYERS) {
            socket.join(roomName);
            gameRooms[roomName].players.push({ id: playerID, hands: [],changed_flg:0 });
            console.log("部屋に割り当てた");
            console.log(gameRooms);
            console.log(gameRooms[roomName].players);
            joinedRoom = true;
            io.to(playerId).emit('joinedRoom', roomName);
            //console.log(gameRooms[roomName]);
            if(gameRooms[roomName].players.length==2){
                create_deck(gameRooms[roomName].deck);
                gameRooms[roomName].players.forEach(player => {
                    io.to(player.id).emit('playersArrived');
                });
                //io.to(playerID).emit('playersArrived');
            }else{
                io.to(playerId).emit('firstPerson');
            }
        }else{
            io.to(playerId).emit('NoVacancy', roomName);
        }
        
    });


    socket.on('distributehands', (data) => {
        //console.log('Clicked:', data);
        const { playerID, roomName } = data;
        //console.log('Clicked:', playerID);
        distributeHands(gameRooms[roomName].players, io, roomName, gameRooms[roomName].deck);
    });

    socket.on('changeCard', (data) => {
        const { playerID, roomName,change_suit,change_rank } = data;
        console.log('change:'+change_suit+change_rank);
        let opponentID;
        for(let i=0;i<gameRooms[roomName].players.length;i++){
            if(gameRooms[roomName].players[i].id==playerID){
                //gameRooms[roomName].players[i].changed_flg=1;
            }else{
                opponentID=gameRooms[roomName].players[i].id;
                console.log("opponentID: "+opponentID);
            }
        }
        for(let i=0;i<gameRooms[roomName].players.length;i++){
            if(gameRooms[roomName].players[i].id==playerID){
                playerindex=i;
                //console.log(gameRooms[roomName].players[i].changed_flg);
                gameRooms[roomName].players[i].changed_flg=1;
                for(let j=0;j<gameRooms[roomName].players[i].hands.length;j++){
                    if(gameRooms[roomName].players[i].hands[j].suit == change_suit && gameRooms[roomName].players[i].hands[j].rank == change_rank){
                        let newCardArray=drawCards(gameRooms[roomName].deck, 1);
                        gameRooms[roomName].players[i].hands.splice(j, 1);
                        gameRooms[roomName].players[i].hands.splice(j,0, newCardArray[0]);
                        // カードを配ったことを各プレイヤーに通知
                        let newcard=newCardArray[0];
                        let location=j;
                        console.log("自分に送る",playerID);
                        io.to(playerID).emit('cardChanged',{newcard,location} );
                        console.log(gameRooms[roomName].players[i].hands);
                    }

                }

            }
        }
    });

    socket.on('ChangeNothing', (data) => {
        //console.log('Clicked:', data);
        const { playerID, roomName,} = data;

        for(let i=0;i<gameRooms[roomName].players.length;i++){
            if(gameRooms[roomName].players[i].id==playerID){
                console.log(gameRooms[roomName].players[i].changed_flg);
                gameRooms[roomName].players[i].changed_flg=1;
            }
        }
        
    });

    socket.on('ChangeCompleted', (data) => {
        //console.log('Clicked:', data);
        const { playerID, roomName,} = data;
        
        if(gameRooms[roomName].players.length==2&&gameRooms[roomName].players[0].changed_flg==1&&gameRooms[roomName].players[1].changed_flg==1){
                    let player1Hand=gameRooms[roomName].players[0].hands;
                    let player2Hand=gameRooms[roomName].players[1].hands;
                    // 手札を判定
                    const player1HandRank = evaluatePokerHand(player1Hand);
                    const player2HandRank = evaluatePokerHand(player2Hand);
                    console.log("player1",gameRooms[roomName].players[0].hands);
                    console.log("player2",gameRooms[roomName].players[1].hands);
                    console.log('player1 Hand:', player1HandRank);
                    console.log('player2 Hand:', player2HandRank);
                    // // 勝敗を判定する
                    const result = determineWinner(player1HandRank, player2HandRank);
                    console.log(result);
                    io.to(gameRooms[roomName].players[0].id).emit('opponentHands',gameRooms[roomName].players[1].hands);
                    io.to(gameRooms[roomName].players[1].id).emit('opponentHands',gameRooms[roomName].players[0].hands);

                    if(result==0){
                        io.to(gameRooms[roomName].players[0].id).emit('resultDetermined',"You won!");
                        io.to(gameRooms[roomName].players[1].id).emit('resultDetermined',"You lost...");
                    }else if(result==1){
                        io.to(gameRooms[roomName].players[0].id).emit('resultDetermined',"You lost...");
                        io.to(gameRooms[roomName].players[1].id).emit('resultDetermined',"You won!");
                    }else{
                        io.to(gameRooms[roomName].players[0].id).emit('resultDetermined',"It's a tie!");
                        io.to(gameRooms[roomName].players[1].id).emit('resultDetermined',"It's a tie!");
                    }
                    gameRooms[roomName].players = [];
                    gameRooms[roomName].deck = [];
                    console.log(gameRooms);
        }
    });


    // 切断の処理をハンドル
    socket.on('disconnect', () => {
        console.log(`Player ${playerId} disconnected`);
        // プレイヤーが切断されたことを通知
        io.emit('playerDisconnected', playerId);
        // ゲームルームからプレイヤーを削除
        //const currentRoom = Object.keys(socket.rooms)[1];
        let currentRoom = null;
for (const roomName in gameRooms) {
    if (gameRooms.hasOwnProperty(roomName)) {
        const playersInRoom = gameRooms[roomName].players;
        for (const player of playersInRoom) {
            if (player.id === playerId) {
                currentRoom = roomName;
                break;
            }
        }
        if (currentRoom) {
            break;
        }
    }
}
        console.log(currentRoom);

        if (currentRoom && gameRooms[currentRoom]) {
            gameRooms[currentRoom].players = gameRooms[currentRoom].players.map((player) => {
                if (player.id === playerId) {
                    return null; // プレイヤーオブジェクトを null に設定
                } else {
                    return player;
                }
            }).filter((player) => player !== null); // null 以外のプレイヤーオブジェクトのみを残す
            
            if(gameRooms[currentRoom].players.length==1){
                io.to(gameRooms[currentRoom].players[0].id).emit('opponentDisappear');
            }
        }
        
        playerCount--;
    });
});


function create_deck(deck){
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

}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function distributeHands(players, io, roomName, deck) {
    // カードを配る処理を追加
    // ...
    console.log("手札を配る");
    // 例: ダミーのカードを配る
    for (let i = 0; i < players.length; i++) {
        players[i].hands = drawCards(deck, 5);
    }
    console.log("配った");
    //console.log(deck);

    // カードを配ったことを各プレイヤーに通知
    for (const player of players) {
        io.to(player.id).emit('handsDistributed', player.hands);
    }

}

function drawCards(deck, count) {
    // デッキから指定した枚数だけカードを引く処理を追加
    const drawnCards = deck.splice(0, count);
    return drawnCards;
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
        return 0;
    } else if (myHandRank < enemyHandRank) {
        return 1;
    } else {
        return 2;
    }
}


server.listen(3000, () => {
    console.log('サーバーがポート3000で起動しました');
});
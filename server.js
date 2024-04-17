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
            }
        }
        
    });

    if (gameRooms[roomName]) {
        //console.log("手札を配る");
        // 手札を配布する
        //distributeHands(gameRooms[roomName].players, io, roomName, gameRooms[roomName].deck);
        //console.log(gameRooms[roomName].players[0].hands);
    }
    //console.log(gameRooms[roomName]);
    // for(let i=0;i<gameRooms[roomName].players.length;i++){
    //     console.log(gameRooms[roomName].players[i].hands);
    // }

    // ここに cardClicked イベントの処理を追加




    socket.on('distributehands', (data) => {
        //console.log('Clicked:', data);
        const { playerID, roomName } = data;
        //console.log('Clicked:', playerID);
        distributeHands(gameRooms[roomName].players, io, roomName, gameRooms[roomName].deck);
    });

    socket.on('changeCard', (data) => {
        const { playerID, roomName,change_suit,change_rank } = data;
        console.log('change:'+change_suit+change_rank);
        //console.log('Clicked:', playerID);
        //console.log(gameRooms[roomName]);
        let opponentID;
        for(let i=0;i<gameRooms[roomName].players.length;i++){
            if(gameRooms[roomName].players[i].id==playerID){
                   
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
                        console.log("相手に送る",opponentID);
                        io.to(opponentID).emit('opponentCardChanged',{newcard,location} );
                        console.log(gameRooms[roomName].players[i].hands);
                    }

                }
                //gameRooms[roomName].players[i].hands =drawCards(gameRooms[roomName].deck, 1);
            }
        }


        //console.log("opponentID: "+opponentID);
        //console.log(gameRooms[roomName].players[0].changed_flg);
        if(gameRooms[roomName].players.length==2&&gameRooms[roomName].players[0].changed_flg==1&&gameRooms[roomName].players[1].changed_flg==1){
            console.log("結果: "+roomName);
            console.log("player1",gameRooms[roomName].players[0].hands);
            console.log("player2",gameRooms[roomName].players[1].hands);
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
    if(players.length==2){
        io.to(players[0].id).emit('opponentHands',players[1].hands);
        io.to(players[1].id).emit('opponentHands',players[0].hands);
    }

}

function drawCards(deck, count) {
    // デッキから指定した枚数だけカードを引く処理を追加
    const drawnCards = deck.splice(0, count);
    return drawnCards;
}



server.listen(3000, () => {
    console.log('サーバーがポート3000で起動しました');
});
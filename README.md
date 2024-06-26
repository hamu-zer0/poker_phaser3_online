# poker_phaser3_online 
phaser3とNode.jsを用いたオンライン対戦ポーカーを作成した。
# クローン後に、動くようにするには
クローンしたフォルダに移動したあと"npm install"を行うだけで実行可能状態になる。続いて、"npm start"を行えばサーバーが起動する。エンドポイントはlocalhost:3000である。

# 遊び方
まず、サーバーにアクセスする。
![1](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/e3399559-fc81-4af9-9198-a69a0c8fdb69)
上画像のような画面になり、room1~roo5の好きな部屋を選ぶ
。
![2](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/d926a41a-a174-40b6-96f4-19538dcc1a60)
選んだルームに割り当てられ、対戦相手が来るのを待つ状態になる。
![3](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/9886e99c-f8eb-4344-85ce-b8a892a35a41)
別のタブでサーバーにアクセスし、同じルームを選ぶと上画像のようになる。
![4](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/1b0f7e5b-213d-4f7c-8453-7f8ad1608a41)
どちらかが手札ボタンを押すと、カードが配られる。
![5](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/3d7d6c8c-d173-42ba-b2f2-1791d01b5615)
交換したいカードをクリックすると赤い枠線で囲まれる。囲まれているカードが、チェンジボタンを押した際に交換されるカードである。交換する必要がないときは、何も選ばずにチェンジボタンを押せばよい。
![6](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/8274c7d9-8aea-4198-9aef-2cf3555fe029)
実際に交換が行われた画面が左のタブである。この状態では、対戦相手のチェンジが終了するまで待つことになる。
![7](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/246b92e1-9444-43f0-aef0-eaba0cc881cf)
両方のプレイヤーが、カードの交換を終えると勝敗が表示される。５秒経過すると、リロードされて最初の画面に戻る。
![8](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/fb3bda6d-62d0-4e49-8055-a3c29c62f00e)

# エラー処理
![9](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/2c219b69-2ca6-48eb-bc8b-33bf88d5eb73)
対戦中に片方のプレイヤーの接続が切れた場合、もう片方のプレイヤーの画面でエラーメッセージが表示され、２秒後にリロードされ最初の画面に戻るようになっている。

# 満室のとき
![10](https://github.com/hamu-zer0/poker_phaser3_online/assets/88695666/1fd18608-5589-47a3-b434-b467248ed27e)
上画像のように、クリックした部屋ですでに二人のプレイヤーがいるときは"No Vacancy"の文字がポップアップする。


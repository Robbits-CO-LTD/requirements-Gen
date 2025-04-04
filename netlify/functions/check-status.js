// Netlifyサーバーレス関数 - 要件定義書生成結果の確認API
// generate-requirements.jsで開始したバックグラウンド処理の状態を確認します

// 共有ストレージ（メモリ）へのアクセス
// 注意: Netlify Functionsはステートレスなので、本番環境ではデータベースを使用する必要があります
const { resultsStorage } = require('./generate-requirements');

// デバッグ用ログ関数
const log = (message) => {
  console.log(`[check-status] ${message}`);
};

// Netlifyサーバーレス関数のハンドラー
exports.handler = async (event, context) => {
  try {
    // リクエストのメソッドを確認
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'メソッドが許可されていません' })
      };
    }
    
    // リクエストボディからセッションIDを取得
    const params = JSON.parse(event.body);
    const { sessionId } = params;
    
    log(`ステータス確認リクエスト受信: セッションID ${sessionId}`);
    
    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'セッションIDが必要です' })
      };
    }
    
    // 対応する結果が存在するか確認
    if (!resultsStorage || !resultsStorage[sessionId]) {
      log(`セッションが見つかりません: ${sessionId}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: '該当するセッションが見つかりませんでした',
          status: 'not_found' 
        })
      };
    }
    
    const result = resultsStorage[sessionId];
    log(`ステータス確認結果: ${result.status} (セッションID: ${sessionId})`);
    
    // 結果を返す
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    log(`ステータス確認エラー: ${error.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'サーバーエラーが発生しました' })
    };
  }
};

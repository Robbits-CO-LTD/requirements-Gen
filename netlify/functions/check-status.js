// Netlifyサーバーレス関数 - 要件定義書生成結果の確認API
// 注意: この機能はgenerate-requirements.jsに統合されました
// このファイルは後方互換性のためのリダイレクトのみを提供します

// 詳細なデバッグ用ログ関数
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '[ERROR]' : '[INFO]';
  console.log(`${prefix} [${timestamp}] [check-status] ${message}`);
};

// Netlifyサーバーレス関数のハンドラー
exports.handler = async (event, context) => {
  log(`チェックステータスリダイレクト: パス=${event.path}, メソッド=${event.httpMethod}`);
  
  try {
    // generate-requirements.jsの関数にリクエストを転送
    // require関数は常に同じインスタンスを返すので、同じプロセス内で実行される
    const generateRequirementsHandler = require('./generate-requirements').handler;
    
    log('リクエストをgenerate-requirements.jsのハンドラに転送します');
    
    // event オブジェクトにパス情報を追加して、check-status 処理が実行されるようにする
    const modifiedEvent = {
      ...event,
      // パスを明示的に設定して check-status として処理されるようにする
      path: event.path.replace(/\/[^\/]+$/, '/check-status')
    };
    
    log(`転送リクエスト: 修正されたパス=${modifiedEvent.path}`);
    
    // generate-requirements.jsのハンドラーを呼び出し、結果をそのまま返す
    return await generateRequirementsHandler(modifiedEvent, context);
    
  } catch (error) {
    log(`リダイレクトエラー: ${error.message}`, 'error');
    if (error.stack) {
      console.error(`[ERROR] Stack trace:`, error.stack);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `サーバーエラー: ${error.message}`,
        message: 'check-status機能はgenerate-requirements.jsに統合されましたが、リダイレクト中にエラーが発生しました',
        timestamp: new Date().toISOString()
      })
    };
  }
};

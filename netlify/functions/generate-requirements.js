// Netlifyサーバーレス関数 - 要件定義書生成API
// Claude APIを呼び出して要件定義書を生成します
// 注意: このファイルはgenerate-requirementsとcheck-statusの両方の機能を含む統合ファイルです

// Claude API設定
const API_MODEL = "claude-3-7-sonnet-20250219";
const MAX_TOKENS = 4000;

// 環境変数から直接APIキーを取得（Netlify管理画面で設定）
// 注意: この方法ではAPIキーはブラウザには公開されません
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://api.anthropic.com/v1/messages';

// バックグラウンド処理用の結果保存ストレージ
// 本番環境ではこれをデータベースに置き換えることを検討する
// 現在はメモリ内ストレージとして実装（サーバー再起動で消失）
const resultsStorage = {};

// バックグラウンドで処理中かどうかを追跡
let isProcessingInBackground = false;

// 詳細なデバッグ用ログ関数
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '[ERROR]' : '[INFO]';
  console.log(`${prefix} [${timestamp}] [generate-requirements] ${message}`);
};

// エラーログ用の特殊関数
const logError = (message, error = null) => {
  log(message, 'error');
  if (error) {
    console.error(`[ERROR] Error details:`, error);
    if (error.stack) {
      console.error(`[ERROR] Stack trace:`, error.stack);
    }
  }
};

// システムプロンプト - 要件定義書作成のエキスパート
const SYSTEM_PROMPT = `あなたは要件定義書作成のエキスパートです。マークダウン形式を使用して、構造化された要件定義書を日本語で作成してください。

以下の要素を含め、各セクションを適切に展開してください：

1. プロジェクト概要
   - プロジェクトの目的と背景
   - 解決する問題点や課題
   - ステークホルダーの特定

2. 機能要件
   - システムが実行する具体的な機能の詳細
   - 各機能の優先度（必須、重要、オプションなど）
   - 入力/出力の詳細

3. 非機能要件
   - パフォーマンス要件
   - セキュリティ要件
   - 信頼性と可用性
   - ユーザビリティとアクセシビリティ

4. ユーザーとユースケース
   - ユーザータイプとペルソナ
   - 主要なユースケースとシナリオ
   - ユーザージャーニーとフロー

5. 技術要件
   - システムアーキテクチャとデザイン
   - 使用技術とフレームワーク
   - 統合要件と外部依存関係

6. 制約と前提条件
   - ビジネス上の制約
   - 技術的制約
   - 規制上の要件

7. プロジェクト計画
   - マイルストーンとスケジュール
   - 必要なリソースとチーム構成
   - リスクと対策

8. 付録資料
   - 用語集
   - システムモデルや図表
   - 参考資料と標準

以下の基準に従って作成してください：
- 明確で具体的な記述を必ず行う
- 各セクションはユーザーから提供された情報に基づいて展開する
- 情報が不足している場合は、一般的なベストプラクティスに基づいて補足する
- 書式は内容を見やすくするため、章立てや箇条書き、表組みを適切に使用する
- プロジェクトの特性に基づいて、必要なセクションを追加したり、関連性の低いセクションは省略したりしても良い

ユーザーからの追加情報や要求に基づいて、既存の要件定義書を適切に更新してください。これは反復的な改善プロセスの一部であり、要件は徐々に理解され、派生し、洗練されていくものです。`;

// 初期テンプレート生成関数
function generateInitialMarkdown(formData) {
  const projectName = formData.projectName || 'プロジェクト名';
  const projectOverview = formData.projectOverview || 'プロジェクトの概要';
  const targetUsers = formData.targetUsers || '客先情報';
  const mainFeatures = formData.mainFeatures || '主要機能';
  const constraints = formData.constraints || '制約条件';
  const timeline = formData.timeline || 'スケジュール';

  return `# ${projectName} 要件定義書

## プロジェクト概要
${projectOverview}

## 客先
${targetUsers}

## 主要機能
${mainFeatures}

## 制約条件
${constraints}

## スケジュール
${timeline}

## 注意
これは初期テンプレートです。AIが詳細な要件定義書をバックグラウンドで生成しています。チャットにメッセージを送信すると、詳細な要件定義書が表示されます。
`;
}

// メッセージIDを生成するユーティリティ関数
function generateSessionId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Netlifyサーバーレス関数のハンドラー - パスに基づいて適切な処理を実行
exports.handler = async (event, context) => {
  // リクエストの詳細情報をログに記録
  log(`リクエスト受信: パス=${event.path}, メソッド=${event.httpMethod}, ヘッダー=${JSON.stringify(event.headers)}`);
  
  try {
    let isCheckStatus = false;
    
    // パスからどの機能が呼び出されているかを判断
    const pathParts = event.path.split('/');
    const functionName = pathParts[pathParts.length - 1];
    log(`関数名を解析: ${functionName}`);
    
    // check-statusへのリクエストを処理
    if (functionName === 'check-status') {
      log('パス名からステータス確認関数を実行します');
      isCheckStatus = true;
    }
    
    // リクエストボディに checkStatus フラグがあるか判断する
    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body);
        if (body.checkStatus === true) {
          log('リクエスト本文のcheckStatusフラグからステータス確認関数を実行します');
          isCheckStatus = true;
        }
      } catch (parseError) {
        log(`リクエストボディのパースエラー: ${parseError.message}`, 'error');
      }
    }
    
    // ステータス確認関数の実行
    if (isCheckStatus) {
      log('ステータス確認関数を実行します');
      return await handleCheckStatus(event, context);
    }
    
    // デフォルトは要件定義書生成処理
    log('要件定義書生成関数を実行します');
    return await handleGenerateRequirements(event, context);
  } catch (error) {
    logError(`ルーティングエラー: ${error.message}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `サーバーエラー: ${error.message}`,
        path: event.path,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// ステータス確認用ハンドラー（元々check-status.jsに実装されていた機能）
async function handleCheckStatus(event, context) {
  log('ステータス確認処理を開始');
  
  try {
    // リクエストのメソッドを確認
    if (event.httpMethod !== 'POST') {
      log(`不正なメソッド: ${event.httpMethod} (POSTが必要)`);
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
      log('セッションIDが指定されていません');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'セッションIDが必要です' })
      };
    }
    
    // メモリ内ストレージのデバッグ情報
    log(`現在のストレージ状態: ${Object.keys(resultsStorage).length}件のセッション, キー: ${Object.keys(resultsStorage).join(', ')}`);
    
    // 対応する結果が存在するか確認
    if (!resultsStorage || !resultsStorage[sessionId]) {
      log(`セッションが見つかりません: ${sessionId}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: '該当するセッションが見つかりませんでした',
          status: 'not_found',
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          availableSessions: Object.keys(resultsStorage)
        })
      };
    }
    
    const result = resultsStorage[sessionId];
    log(`ステータス確認結果: ${result.status} (セッションID: ${sessionId})`);
    
    // 結果を返す
    return {
      statusCode: 200,
      body: JSON.stringify({
        ...result,
        timestamp: new Date().toISOString(),
        _debug: { functionName: 'check-status' }
      })
    };
  } catch (error) {
    logError(`ステータス確認エラー: ${error.message}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `サーバーエラー: ${error.message}`,
        timestamp: new Date().toISOString(),
        debug: { stack: error.stack }
      })
    };
  }
}

// 要件定義書生成用ハンドラー（元々のgenerate-requirements.jsのメイン処理）
async function handleGenerateRequirements(event, context) {
  // デバッグ情報
  log(`要件定義書生成関数実行開始: ${new Date().toISOString()}`);
  log(`環境: API_KEY=${ANTHROPIC_API_KEY ? '設定済み' : '未設定'}`);
  log(`API_ENDPOINT: ${API_ENDPOINT}`);

  // POSTリクエストのみ許可
  if (event.httpMethod !== "POST") {
    log('不正なメソッド: ' + event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        error: 'メソッドが許可されていません',
        method: event.httpMethod,
        requiredMethod: 'POST',
        timestamp: new Date().toISOString()
      })
    };
  }

  try {
    // リクエストボディをパース
    log('リクエストボディをパース中...');
    const body = JSON.parse(event.body);
    const { messages, formData, currentMarkdown } = body;
    log(`パース完了: メッセージ数=${messages?.length || 0}, フォームデータ=${formData ? '存在' : '未指定'}, マークダウン=${currentMarkdown ? '存在' : '未指定'}`);
    
    // デバッグ情報として本文の一部をログに記録（秘密情報を除外）
    if (formData) {
      log(`プロジェクト情報: ${formData.projectName || 'なし'} (${formData.projectOverview ? formData.projectOverview.substring(0, 30) + '...' : 'なし'})`);
    }

    // 入力検証
    if (!messages || !Array.isArray(messages)) {
      log('不正なリクエスト形式: messages配列がありません');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '不正なリクエスト形式: messages配列が必要です' })
      };
    }

    // APIキーの確認
    if (!ANTHROPIC_API_KEY) {
      log('APIキーが設定されていません - 環境変数を確認してください');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'サーバー設定エラー: APIキーが設定されていません。Netlify管理画面で環境変数を確認してください。' 
        })
      };
    }

    // 会話履歴とプロジェクト情報を含むプロンプトを構築
    let prompt = "以下のプロジェクト情報に基づいて要件定義書を作成または更新してください：\n\n";
    
    if (formData) {
      prompt += `プロジェクト名: ${formData.projectName || 'なし'}\n`;
      prompt += `概要: ${formData.projectOverview || 'なし'}\n`;
      prompt += `対象ユーザー: ${formData.targetUsers || 'なし'}\n`;
      prompt += `主要機能: ${formData.mainFeatures || 'なし'}\n`;
      prompt += `制約条件: ${formData.constraints || 'なし'}\n`;
      prompt += `スケジュール: ${formData.timeline || 'なし'}\n\n`;
    }
    
    if (currentMarkdown) {
      prompt += "現在の要件定義書:\n" + currentMarkdown + "\n\n";
    }
    
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      prompt += "ユーザーからの追加情報:\n";
      userMessages.forEach(msg => {
        prompt += `- ${msg.content}\n`;
      });
    }

    log('Claude APIリクエストをバックグラウンドで処理します...');
    log(`処理モード: バックグラウンド=${!isProcessingInBackground ? '開始' : '既に処理中'}`);

    // セッションIDを生成（結果を取得するためのID）
    const sessionId = generateSessionId();
    
    // 初期マークダウンを生成
    const initialMarkdown = generateInitialMarkdown(formData);
    
    // 初期状態をストレージに保存
    resultsStorage[sessionId] = {
      status: 'processing',
      timestamp: Date.now(),
      markdown: initialMarkdown,
      message: '要件定義書を生成中です...',
      formData: formData,
      debug: {
        createdAt: new Date().toISOString(),
        function: 'generate-requirements',
        promptLength: prompt ? prompt.length : 0
      }
    };
    
    // ストレージ更新をログに記録
    log(`ストレージ更新: セッションID=${sessionId}, 状態=processing, ストレージ内セッション数=${Object.keys(resultsStorage).length}`);
    
    // バックグラウンドでAPIリクエストを処理
    if (!isProcessingInBackground) {
      isProcessingInBackground = true;
      
      // バックグラウンドで処理を開始（レスポンスを待たずに即座に帰す）
      setTimeout(async () => {
        try {
          log(`バックグラウンド処理開始: セッションID=${sessionId}, タイムスタンプ=${new Date().toISOString()}`);
          log(`バックグラウンド処理の詳細: モデル=${API_MODEL}, 最大トークン=${MAX_TOKENS}, 温度=${0.7}`);
          
          // Claude APIを呼び出す
          const apiResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'anthropic-beta': 'claude-3-7-20250423'
            },
            body: JSON.stringify({
              model: API_MODEL,
              max_tokens: MAX_TOKENS,
              system: SYSTEM_PROMPT,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              // トラブルシューティング用の追加パラメーター
              stream: false,
              metadata: {
                user_id: sessionId
              }
            })
          });
          
          log(`Claude APIリクエスト送信: モデル=${API_MODEL}, セッションID=${sessionId}`);
          
          // エラーチェック
          if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            log(`バックグラウンド処理 Claude APIエラー: ${apiResponse.status} - ${errorText}`);
            
            // エラー情報をストレージに保存
            resultsStorage[sessionId] = {
              ...resultsStorage[sessionId],
              status: 'error',
              error: `Claude API エラー (${apiResponse.status})`,
              details: errorText,
              timestamp: Date.now(),
              debug: {
                ...(resultsStorage[sessionId].debug || {}),
                errorTimestamp: new Date().toISOString(),
                errorType: 'api_response_error',
                httpStatus: apiResponse.status
              }
            };
            
            // エラー状態の詳細ログ
            logError(`Claude APIエラー詳細: ステータス=${apiResponse.status}, エラー=${errorText}`);
            
          } else {
            // APIレスポンスを処理
            const data = await apiResponse.json();
            log('バックグラウンド処理 Claude API応答受信完了');
            log(`レスポンスデータ構造: ${JSON.stringify(Object.keys(data))}`);
            
            // APIレスポンスからマークダウン部分を抽出
            // Claude 3.7のレスポンス形式に対応
            let generatedMarkdown = '';
            if (data.content && Array.isArray(data.content)) {
              generatedMarkdown = data.content[0]?.text || '';
              log(`Claude 3.7形式レスポンスを検出: テキスト長=${generatedMarkdown.length}`);
            } else if (data.completion) {
              // 旧形式の場合のフォールバック
              generatedMarkdown = data.completion;
              log(`旧形式レスポンスを検出: テキスト長=${generatedMarkdown.length}`);
            }
            log(`バックグラウンド処理完了: マークダウン生成成功 (長さ: ${generatedMarkdown.length})`);
            
            // 結果をストレージに保存
            resultsStorage[sessionId] = {
              ...resultsStorage[sessionId],
              status: 'completed',
              markdown: generatedMarkdown,
              message: '要件定義書が生成されました',
              timestamp: Date.now(),
              debug: {
                ...(resultsStorage[sessionId].debug || {}),
                completedAt: new Date().toISOString(),
                markdownLength: generatedMarkdown.length,
                processingTimeMs: Date.now() - resultsStorage[sessionId].timestamp
              }
            };
            
            // 完了状態の詳細ログ
            log(`要件定義書生成完了: セッションID=${sessionId}, マークダウン長=${generatedMarkdown.length}文字, 処理時間=${Date.now() - resultsStorage[sessionId].timestamp}ms`);
          }
        } catch (error) {
          log(`バックグラウンド処理エラー: ${error.message}`);
          
          // エラー情報をストレージに保存
          resultsStorage[sessionId] = {
            ...resultsStorage[sessionId],
            status: 'error',
            error: error.message,
            timestamp: Date.now(),
            debug: {
              ...(resultsStorage[sessionId].debug || {}),
              errorTimestamp: new Date().toISOString(),
              errorType: 'processing_error',
              errorStack: error.stack
            }
          };
          
          // エラー状態の詳細ログ
          logError(`バックグラウンド処理エラー詳細: セッションID=${sessionId}, エラー=${error.message}`, error);
        }
        
        // バックグラウンド処理完了を記録
        isProcessingInBackground = false;
      }, 0);
    }
    
    // クライアントに即座に初期レスポンスを返す
    log(`即座に初期レスポンスを返します（セッションID: ${sessionId}, タイムスタンプ: ${new Date().toISOString()}）`);
    log(`ストレージ状態: ${Object.keys(resultsStorage).length}件のセッション, 最新セッション: ${sessionId}`);
    const generatedMarkdown = initialMarkdown;
    
    // クライアントにレスポンスを返す
    return {
      statusCode: 200,
      body: JSON.stringify({
        markdown: generatedMarkdown,
        message: '要件定義書を生成中です...',
        sessionId: sessionId,
        status: 'processing',
        timestamp: new Date().toISOString(),
        _debug: { 
          functionName: 'generate-requirements',
          mode: 'background_processing' 
        }
      })
    };
    
  } catch (error) {
    // エラー処理
    logError(`要件定義生成エラー: ${error.message}`, error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `サーバーエラー: ${error.message}`,
        timestamp: new Date().toISOString(),
        debug: { 
          errorType: 'handler_error',
          stack: error.stack,
          functionName: 'generate-requirements' 
        }
      })
    };
  }
};

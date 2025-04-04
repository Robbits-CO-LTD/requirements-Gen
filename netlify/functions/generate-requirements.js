// Netlifyサーバーレス関数 - 要件定義書生成API
// Claude APIを呼び出して要件定義書を生成します

// Claude API設定
const API_MODEL = "claude-3-sonnet-20240229";
const MAX_TOKENS = 4000;

// 環境変数から直接APIキーを取得（Netlify管理画面で設定）
// 注意: この方法ではAPIキーはブラウザには公開されません
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://api.anthropic.com/v1/messages';

// デバッグ用ログ関数
const log = (message) => {
  console.log(`[generate-requirements] ${message}`);
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

// Netlifyサーバーレス関数のハンドラー
exports.handler = async (event, context) => {
  // デバッグ情報
  log(`関数実行開始: ${new Date().toISOString()}`);
  log(`環境: API_KEY=${ANTHROPIC_API_KEY ? '設定済み' : '未設定'}`);
  log(`API_ENDPOINT: ${API_ENDPOINT}`);

  // POSTリクエストのみ許可
  if (event.httpMethod !== "POST") {
    log('不正なメソッド: ' + event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'メソッドが許可されていません' })
    };
  }

  try {
    // リクエストボディをパース
    const body = JSON.parse(event.body);
    const { messages, formData, currentMarkdown } = body;

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

    log('Claude APIリクエスト送信中...');

    // Claude APIを呼び出す
    const apiResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
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
        temperature: 0.7
      })
    });

    // エラーチェック
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      log(`Claude APIエラー: ${apiResponse.status} - ${errorText}`);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: `Claude API エラー (${apiResponse.status})`, 
          details: errorText 
        })
      };
    }

    // APIレスポンスを処理
    const data = await apiResponse.json();
    log('Claude API応答受信完了');

    // APIレスポンスからマークダウン部分を抽出
    const generatedMarkdown = data.content?.[0]?.text || '';
    
    // クライアントにレスポンスを返す
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '要件定義書を更新しました。さらに詳細を追加するには、具体的な質問や要望をお知らせください。',
        markdown: generatedMarkdown
      })
    };
    
  } catch (error) {
    // エラー処理
    log(`要件定義生成エラー: ${error.message}`);
    log(error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `サーバーエラー: ${error.message}` 
      })
    };
  }
};

// LLMを使用して要件定義書を生成するAPIエンドポイント
import { config } from 'dotenv';
config();

// Claude API設定
const API_MODEL = "claude-3-sonnet-20240229";
const MAX_TOKENS = 4000;

// 環境変数の診断情報をログに出力
console.log('API KEY STATUS:', process.env.ANTHROPIC_API_KEY ? '設定済み' : '未設定');
console.log('API URL STATUS:', process.env.API_ENDPOINT ? '設定済み（カスタム）' : '未設定（デフォルト使用）');

export default async function handler(req, res) {
  // リクエストメソッドの確認
  if (req.method !== 'POST') {
    console.log('不正なメソッド:', req.method);
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  try {
    // リクエストボディをログに記録（機密情報は除く）
    console.log('リクエスト受信:', {
      messageCount: req.body.messages?.length || 0,
      formDataPresent: !!req.body.formData,
      markdownLength: req.body.currentMarkdown?.length || 0
    });

    // APIキーの確認
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Anthropic API Keyが設定されていません');
      return res.status(500).json({ 
        error: 'サーバー設定エラー: Anthropic API Keyが設定されていません' 
      });
    }

    // リクエストボディの検証
    const { messages, formData, currentMarkdown } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('不正なリクエスト形式: messages配列がありません');
      return res.status(400).json({ error: '不正なリクエスト形式: messages配列が必要です' });
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

    console.log('LLM APIリクエストを送信中...');

    // Anthropic Claude APIを呼び出す
    const apiEndpoint = process.env.API_ENDPOINT || 'https://api.anthropic.com/v1/messages';
    console.log(`使用APIエンドポイント: ${apiEndpoint}`);
    console.log(`使用モデル: ${API_MODEL}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: API_MODEL,
        max_tokens: MAX_TOKENS,
        system: `あなたは要件定義書作成のエキスパートです。マークダウン形式を使用して、構造化された要件定義書を日本語で作成してください。

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

ユーザーからの追加情報や要求に基づいて、既存の要件定義書を適切に更新してください。これは反復的な改善プロセスの一部であり、要件は徐々に理解され、派生し、海化されていくものです。`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude APIエラー:', response.status, errorData);
      return res.status(500).json({ 
        error: `Claude APIエラー: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Claude API応答受信');

    // APIレスポンスからマークダウン部分を抽出
    const generatedMarkdown = data.content?.[0]?.text || '';
    
    // クライアントにレスポンスを返す
    return res.status(200).json({
      message: '要件定義書を更新しました。さらに詳細を追加するには、具体的な質問や要望をお知らせください。',
      markdown: generatedMarkdown
    });
    
  } catch (error) {
    console.error('要件定義生成エラー:', error);
    return res.status(500).json({ 
      error: `サーバーエラー: ${error.message}` 
    });
  }
}

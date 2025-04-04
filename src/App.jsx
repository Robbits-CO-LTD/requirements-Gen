import { useState, useEffect } from 'react';
import RequirementsForm from './components/RequirementsForm';
import ChatInterface from './components/ChatInterface';
import MarkdownPreview from './components/MarkdownPreview';
import { saveAs } from 'file-saver';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectName: '',
    projectOverview: '',
    targetUsers: '',
    mainFeatures: '',
    constraints: '',
    timeline: ''
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // ログを追加する関数
  const addLog = (message) => {
    console.log(message); // コンソールにも出力
    setLogs(prevLogs => [...prevLogs, { time: new Date().toLocaleTimeString(), message }]);
  };

  // コンポーネントがマウントされたときに初期設定の確認
  useEffect(() => {
    // API状態をログに記録
    addLog('アプリケーション起動: サーバーレス関数を使用してAPIと通信します');
    // APIのテストを行う場合はここにコードを追加
  }, []);

  const handleFormSubmit = async (data) => {
    setFormData(data);
    
    // フォームデータを元に初期Markdownを生成
    const initialMarkdown = generateMarkdown(data);
    setMarkdownContent(initialMarkdown);
    
    // システムからの最初のメッセージ
    setChatMessages([
      { 
        role: 'system', 
        content: '要件定義書の初期バージョンを生成しました。詳細の追加や修正について、お気軽にお尋ねください。' 
      }
    ]);
    
    // 画面遷移
    setStep(2);
    
    // 初期データをもとにLLMを呼び出し要件定義書を生成
    setTimeout(async () => {
      try {
        setLoading(true);
        addLog('初期要件定義書を生成中...');
        
        // 初期メッセージを作成
        const initialMessage = `このプロジェクトの要件定義書を作成してください。`;
        
        // LLM呼び出し用メッセージに追加
        const updatedMessages = [
          ...chatMessages,
          { role: 'user', content: initialMessage }
        ];
        
        // サーバーレス関数のエンドポイント
        const apiUrl = '/.netlify/functions/generate-requirements';
        addLog(`初期要件定義APIリクエスト送信: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: updatedMessages,
            formData: data,
            currentMarkdown: initialMarkdown
          })
        });
        
        addLog(`APIレスポンスステータス: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`APIエラー (${response.status}): ${errorData}`);
        }
        
        const responseData = await response.json();
        addLog('APIレスポンス受信完了');
        
        // AIの応答を追加
        const systemResponse = { 
          role: 'system', 
          content: responseData.message || '要件定義書を生成しました。他に詳細を追加したいポイントがあればお知らせください。' 
        };
        
        setChatMessages([...updatedMessages, systemResponse]);
        
        // 要件定義書の内容を更新
        if (responseData.markdown) {
          setMarkdownContent(responseData.markdown);
          addLog('要件定義書を生成しました');
        }
      } catch (err) {
        console.error('初期要件定義書生成エラー:', err);
        addLog(`エラー発生: ${err.message}`);
        setError(err.message);
        
        // エラーメッセージをチャットに表示
        const errorResponse = {
          role: 'system',
          content: `要件定義書生成中にエラーが発生しました: ${err.message}`
        };
        
        setChatMessages([...chatMessages, { role: 'user', content: initialMessage }, errorResponse]);
      } finally {
        setLoading(false);
      }
    }, 500); // 少し遅延を入れて画面遷移後に実行
  };

  const handleChatSend = async (message) => {
    // エラー状態をリセット
    setError(null);
    
    // ユーザーメッセージを追加
    const updatedMessages = [
      ...chatMessages,
      { role: 'user', content: message }
    ];
    
    setChatMessages(updatedMessages);
    setLoading(true); // ローディング状態をONに
    
    // APIリクエストの詳細をログに記録
    addLog(`AI APIリクエスト送信開始: "${message}"`); 

    try {
      // APIリクエストのURLを決定 - Netlifyのサーバーレス関数を使用
      const apiUrl = '/.netlify/functions/generate-requirements';
      addLog(`APIエンドポイント: ${apiUrl}`);
      
      // サーバーレス関数へのリクエスト
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 認証情報はサーバーレス関数内で処理するのでここには不要
        },
        body: JSON.stringify({
          messages: updatedMessages,
          formData: formData,
          currentMarkdown: markdownContent
        })
      });
      
      addLog(`APIレスポンスステータス: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`APIエラー (${response.status}): ${errorData}`);
      }
      
      const data = await response.json();
      addLog('APIレスポンス受信完了');
      
      // AIの応答を追加
      const systemResponse = { 
        role: 'system', 
        content: data.message || 'レスポンスを受信しました' 
      };
      
      setChatMessages([...updatedMessages, systemResponse]);
      
      // 更新された要件定義書の内容を設定
      if (data.markdown) {
        setMarkdownContent(data.markdown);
        addLog('要件定義書を更新しました');
      } else {
        // バックアッププラン: APIが要件定義書を返さない場合のフォールバック
        const updatedMarkdown = markdownContent + `\n\n## ${message}についての補足\n- 詳細情報をここに追加します\n- より具体的な要件が記載されます`;
        setMarkdownContent(updatedMarkdown);
        addLog('警告: APIからの要件定義書データがないため、デフォルト内容で更新しました');
      }
      
    } catch (err) {
      console.error('要件定義生成エラー:', err);
      addLog(`エラー発生: ${err.message}`);
      setError(err.message);
      
      // エラーメッセージをチャットに表示
      const errorResponse = {
        role: 'system',
        content: `エラーが発生しました: ${err.message}\n環境変数の設定を確認してください。`
      };
      
      setChatMessages([...updatedMessages, errorResponse]);
    } finally {
      setLoading(false); // 処理完了
    }
  };

  const generateMarkdown = (data) => {
    return `# ${data.projectName} 要件定義書

## プロジェクト概要
${data.projectOverview}

## 対象ユーザー
${data.targetUsers}

## 主要機能
${data.mainFeatures}

## 制約条件
${data.constraints}

## スケジュール
${data.timeline}
`;
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${formData.projectName}_要件定義書.md`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-6">要件定義書ジェネレーター</h1>
      
      {step === 1 ? (
        <RequirementsForm onSubmit={handleFormSubmit} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ChatInterface 
                messages={chatMessages} 
                onSend={handleChatSend} 
                loading={loading}
                error={error}
              />
            </div>
            <div>
              <MarkdownPreview 
                content={markdownContent} 
                onDownload={downloadMarkdown} 
              />
            </div>
          </div>
          
          {/* ログ表示エリア */}
          <div className="mt-8 bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">API通信ログ</h3>
            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-auto max-h-40">
              {logs.length === 0 ? (
                <p>ログはまだありません</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-400">[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

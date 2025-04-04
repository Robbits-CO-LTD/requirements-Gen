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
  const [sessionId, setSessionId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

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
    
    // クリーンアップ関数
    return () => {
      // ポーリングインターバルをクリア
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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
      // 初期メッセージを作成（変数をスコープの最上部に移動）
      const initialMessage = `このプロジェクトの要件定義書を作成してください。`;
      
      try {
        setLoading(true);
        addLog('初期要件定義書を生成中...');
        
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
        
        // セッションIDを保存し、ポーリングを開始
        if (responseData.sessionId && responseData.status === 'processing') {
          setSessionId(responseData.sessionId);
          addLog(`バックグラウンド処理開始: セッションID ${responseData.sessionId}`);
          
          // 初期テンプレートを表示
          if (responseData.markdown) {
            setMarkdownContent(responseData.markdown);
            addLog('初期テンプレートを表示しました（バックグラウンドで詳細生成中）');
          }
          
          // 初期メッセージを追加
          const processingResponse = { 
            role: 'system', 
            content: '要件定義書を生成中です...しばらくお待ちください。' 
          };
          
          setChatMessages([...updatedMessages, processingResponse]);
        } else {
          // 通常の応答処理（バックグラウンド処理なしの場合のフォールバック）
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

  // バックグラウンド処理のステータスを確認する関数
  const checkProcessingStatus = async () => {
    if (!sessionId) return;
    
    try {
      addLog(`ステータス確認中: セッションID ${sessionId}`);
      
      // ステータス確認用の関数を変更（統合された関数を使用）
      const statusUrl = '/.netlify/functions/generate-requirements';
      const response = await fetch(statusUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sessionId,
          checkStatus: true, // ステータス確認フラグを追加
          messages: [] // 空のメッセージ配列を追加（APIが必要とするため）
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`ステータス確認エラー (${response.status}): ${errorData}`);
      }
      
      const statusData = await response.json();
      addLog(`ステータス確認結果: ${statusData.status}`);
      
      // ステータスが完了またはエラーの場合はポーリングを停止
      if (statusData.status === 'completed' || statusData.status === 'error') {
        // ポーリングを停止
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
          addLog(`ポーリング停止: ${statusData.status === 'completed' ? '処理完了' : 'エラー発生'}`);
        }
        
        // さらにセッションIDもクリアして、ポーリングメカニズムが再開しないようにする
        setSessionId(null);
        addLog('セッションIDをクリア: ポーリングの完全終了');
        
        // ポーリング終了フラグを設定して二重実行を防止
        window._pollingCompleted = true;
        
        if (statusData.status === 'completed') {
          // 完了した場合は結果を表示
          setMarkdownContent(statusData.markdown);
          setLoading(false);
          
          // チャットメッセージを更新
          setChatMessages(prev => {
            // 処理中メッセージを完了メッセージに置き換え
            const newMessages = [...prev];
            const lastMessage = newMessages.pop(); // 最後のメッセージを取得
            
            newMessages.push({
              role: 'system',
              content: '要件定義書が生成されました。詳細の追加や修正について、お気軽にお尋ねください。'
            });
            
            return newMessages;
          });
          
          addLog('要件定義書生成完了');
        } else {
          // エラーの場合
          setError(statusData.error || '不明なエラーが発生しました');
          setLoading(false);
          
          // エラーメッセージをチャットに表示
          setChatMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages.pop(); // 最後のメッセージを取得
            
            newMessages.push({
              role: 'system',
              content: `エラーが発生しました: ${statusData.error || '不明なエラー'}`
            });
            
            return newMessages;
          });
          
          addLog(`エラー発生: ${statusData.error || '不明なエラー'}`);
        }
      }
    } catch (error) {
      console.error('ステータス確認エラー:', error);
      addLog(`ステータス確認エラー: ${error.message}`);
    }
  };
  
  // ポーリング処理を追加するエフェクト
  useEffect(() => {
    // 既に完了している場合はポーリングを開始しない
    if (window._pollingCompleted) {
      addLog('既にポーリングは完了しています。新規ポーリングは開始しません');
      return;
    }
    
    // セッションIDが存在していて、ポーリングが設定されていない場合に開始
    if (sessionId && !pollingInterval) {
      addLog(`ポーリング開始: セッションID ${sessionId}`);
      
      // ポーリング回数を追跡するカウンター
      let pollCount = 0;
      const maxPolls = 20; // 最大ポーリング回数（安全装置）
      
      // 3秒ごとに状態確認
      const interval = setInterval(async () => {
        try {
          // 最大ポーリング回数に達した場合は停止
          if (pollCount >= maxPolls) {
            addLog(`最大ポーリング回数(${maxPolls})に到達: ポーリングを停止します`);
            clearInterval(interval);
            setPollingInterval(null);
            setSessionId(null);
            window._pollingCompleted = true;
            return;
          }
          
          pollCount++;
          await checkProcessingStatus();
        } catch (error) {
          console.error('ポーリングエラー:', error);
          addLog(`ポーリングエラー: ${error.message}`);
          
          // エラーが発生した場合もカウントを増やす
          pollCount++;
        }
      }, 3000);
      
      setPollingInterval(interval);
    }
    
    // クリーンアップ関数
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [sessionId, pollingInterval]);

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
    <div className="container mx-auto px-4 py-8 max-w-5xl relative">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">要件定義書ジェネレーター</h1>
      
      {step === 1 ? (
        <RequirementsForm onSubmit={handleFormSubmit} />
      ) : (
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onBack={() => {
                  setStep(1);
                  // ポーリングが正確に停止しない根本原因の対策としてセッションリセットも行う
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                  }
                  // セッションIDもクリアしてポーリングが再開しないようにする
                  setSessionId(null);
                  // クライアントサイドフラグもリセット
                  window._pollingCompleted = true;
                  addLog('最初の画面に戻りました。ポーリングとセッションを終了しました。');
                }}
              />
            </div>
          </div>
          
          {/* ログ表示エリア */}
          <div className="mt-10 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              API通信ログ
            </h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-xs leading-relaxed overflow-auto max-h-32 border border-gray-800">
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

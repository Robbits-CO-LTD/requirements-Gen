import { useState } from 'react';
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

  const handleFormSubmit = (data) => {
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
    
    setStep(2);
  };

  const handleChatSend = (message) => {
    // ユーザーメッセージを追加
    const updatedMessages = [
      ...chatMessages,
      { role: 'user', content: message }
    ];
    
    setChatMessages(updatedMessages);
    
    // 実際のアプリではここでAIサービスとの連携処理を行います
    // 現在はモックレスポンスを返すだけの実装になっています
    setTimeout(() => {
      const systemResponse = { 
        role: 'system', 
        content: `「${message}」についての詳細を要件定義書に追加しました。さらに詳しく説明していただくことで、より詳細な要件定義書を作成できます。` 
      };
      
      setChatMessages([...updatedMessages, systemResponse]);
      
      // ここで要件定義書の内容を更新（実際はAIの応答に基づいて更新）
      const updatedMarkdown = markdownContent + `\n\n## ${message}についての補足\n- 詳細情報をここに追加します\n- より具体的な要件が記載されます`;
      setMarkdownContent(updatedMarkdown);
    }, 1000);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ChatInterface 
              messages={chatMessages} 
              onSend={handleChatSend} 
            />
          </div>
          <div>
            <MarkdownPreview 
              content={markdownContent} 
              onDownload={downloadMarkdown} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

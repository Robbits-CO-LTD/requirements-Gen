import { useState } from 'react';

const ChatInterface = ({ messages, onSend, loading, error }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">要件の詳細調整</h2>
        <p className="text-sm text-gray-600">こちらで要件を詳しく伝えると自動的に要件定義書に反映されます</p>
      </div>
      
      <div className="flex-1 p-4 overflow-auto flex flex-col space-y-2 max-h-[400px]">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.role === 'user' ? 'user-message' : 'system-message'} max-w-[80%] ${msg.role === 'user' ? 'ml-auto' : ''} ${msg.role === 'system' && error ? 'error-message bg-red-100 text-red-800' : ''}`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
        
        {/* ローディングインジケーター */}
        {loading && (
          <div className="loading-indicator self-start flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animation-delay-200"></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animation-delay-400"></div>
            </div>
            <span className="text-sm text-gray-600">AI処理中...</span>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="追加の要件や詳細を入力..."
            disabled={loading}
          />
          <button
            type="submit"
            className={`${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-r-md`}
            disabled={loading}
          >
            {loading ? '処理中...' : '送信'}
          </button>
        </form>
        
        {/* APIエラーメッセージ (チャットメッセージと別に表示する場合) */}
        {error && !messages.some(msg => msg.role === 'system' && msg.content.includes('エラー')) && (
          <div className="mt-3 p-2 bg-red-100 text-red-800 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

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
      <div className="px-6 py-5 border-b">
        <h2 className="text-lg font-bold text-gray-900">要件の詳細調整</h2>
        <p className="mt-2 text-sm text-gray-600">こちらで要件を詳しく伝えると自動的に要件定義書に反映されます</p>
      </div>
      
      <div className="flex-1 px-6 py-5 overflow-auto flex flex-col space-y-4 max-h-[450px]">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.role === 'user' ? 'user-message' : 'system-message'} max-w-[90%] ${msg.role === 'user' ? 'ml-auto' : ''} ${msg.role === 'system' && error ? 'error-message bg-red-50 border border-red-200 text-red-800' : ''}`}
          >
            <div className="flex items-start">
              {msg.role === 'system' && (
                <div className="flex-shrink-0 mr-2 mt-0.5">
                  <div className="h-6 w-6 bg-[#1264a3] text-white rounded-sm flex items-center justify-center text-xs font-medium">AI</div>
                </div>
              )}
              <div className="flex-1">
                <p className="text-base leading-relaxed">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* ローディングインジケーター */}
        {loading && (
          <div className="loading-indicator self-start flex items-center space-x-3 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
            <div className="animate-pulse flex space-x-1.5">
              <div className="h-3 w-3 bg-[#1264a3] rounded-full"></div>
              <div className="h-3 w-3 bg-[#1264a3] rounded-full animation-delay-200"></div>
              <div className="h-3 w-3 bg-[#1264a3] rounded-full animation-delay-400"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">AI処理中...</span>
          </div>
        )}
      </div>
      
      <div className="px-6 py-5 border-t">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1264a3] shadow-sm transition-all duration-200"
              placeholder="追加の要件や詳細を入力..."
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className={`${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1264a3] hover:bg-[#0b4f82]'} text-white px-5 py-3.5 rounded-xl transition-all duration-150 shadow-sm flex items-center justify-center min-w-[80px]`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>処理中...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span>送信</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(90, 10, 10)" />
                </svg>
              </div>
            )}
          </button>
        </form>
        
        {/* APIエラーメッセージ (チャットメッセージと別に表示する場合) */}
        {error && !messages.some(msg => msg.role === 'system' && msg.content.includes('エラー')) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm shadow-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

import { useState } from 'react';

const ChatInterface = ({ messages, onSend }) => {
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
            className={`chat-message ${msg.role === 'user' ? 'user-message' : 'system-message'} max-w-[80%] ${msg.role === 'user' ? 'ml-auto' : ''}`}
          >
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="追加の要件や詳細を入力..."
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;

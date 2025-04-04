import { useEffect, useState } from 'react';
import { marked } from 'marked';

const MarkdownPreview = ({ content, onDownload, onBack }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // マークダウンをHTMLに変換
    setHtml(marked(content));
  }, [content]);

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">要件定義書プレビュー</h2>
        <button
          onClick={onDownload}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          MDファイルダウンロード
        </button>
      </div>
      
      {/* 戻るボタンをプレビューの外に配置 */}
      {onBack && (
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 flex items-center bg-white hover:bg-gray-50 shadow-sm rounded-full p-2 transition-colors duration-200"
            title="最初の画面に戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-auto max-h-[500px]">
        <div 
          className="prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
};

export default MarkdownPreview;

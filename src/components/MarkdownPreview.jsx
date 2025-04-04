import { useEffect, useState } from 'react';
import { marked } from 'marked';

const MarkdownPreview = ({ content, onDownload, onBack }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // マークダウンをHTMLに変換
    setHtml(marked(content));
  }, [content]);

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* 戻るボタン */}
          {onBack && (
            <button 
              onClick={onBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded inline-flex items-center text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              最初の画面に戻る
            </button>
          )}
          <h2 className="text-xl font-semibold">要件定義書プレビュー</h2>
        </div>
        <button
          onClick={onDownload}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
        >
          MDファイルダウンロード
        </button>
      </div>
      
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

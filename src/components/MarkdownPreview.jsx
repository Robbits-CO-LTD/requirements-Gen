import { useEffect, useState } from 'react';
import { marked } from 'marked';

// GitHubスタイルのMarkdownプレビューコンポーネント
const MarkdownPreview = ({ content, onDownload, onBack }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // マークダウンをHTMLに変換
    setHtml(marked(content));
  }, [content]);

  return (
    <div className="border border-gray-200 rounded-md shadow-sm h-full flex flex-col overflow-hidden bg-white relative">
      {/* GitHub風ヘッダー */}
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center sticky top-0">
        <div className="flex items-center">
          {/* 戻るボタン - 常に表示 */}
          {onBack && (
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md p-1.5 mr-2 transition-colors duration-150 flex items-center"
              title="最初の画面に戻る"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h2 className="text-gray-900 font-medium text-sm">要件定義書プレビュー</h2>
        </div>
        <button
          onClick={onDownload}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150 text-gray-700"
        >
          <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ダウンロード
        </button>
      </div>
      
      {/* GitHub風のマークダウンコンテンツエリア */}
      <div className="flex-1 p-5 overflow-auto max-h-[600px] bg-white">
        <div 
          className="prose prose-gray max-w-none markdown-body" 
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#24292e'
          }}
        />
      </div>
    </div>
  );
};

export default MarkdownPreview;

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
    <div className="border border-gray-200 rounded-lg shadow-sm h-full flex flex-col overflow-hidden bg-white relative">
      {/* 戻るボタン - ヘッダーの代わりに固定配置 */}
      {onBack && (
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <button 
            onClick={onBack}
            className="flex items-center bg-white hover:bg-gray-100 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 shadow-sm transition-colors duration-150"
            title="最初の画面に戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            最初の画面に戻る
          </button>
        </div>
      )}

      {/* GitHub風ヘッダー */}
      <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0">
        <h2 className="text-gray-900 font-bold text-lg pl-2">要件定義書プレビュー</h2>
        <button
          onClick={onDownload}
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-150 text-gray-700 shadow-sm"
        >
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ダウンロード
        </button>
      </div>
      
      {/* GitHub風のマークダウンコンテンツエリア */}
      <div className="flex-1 px-8 py-6 overflow-auto max-h-[600px] bg-white">
        <div 
          className="prose prose-gray max-w-4xl mx-auto markdown-body" 
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontFamily: '"Lato", "Slack-Lato", "Helvetica Neue", "Helvetica", "Segoe UI", Tahoma, Arial, sans-serif',
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

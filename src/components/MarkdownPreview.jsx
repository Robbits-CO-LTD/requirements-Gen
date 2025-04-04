import { useEffect, useState } from 'react';
import { marked } from 'marked';

const MarkdownPreview = ({ content, onDownload }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // マークダウンをHTMLに変換
    setHtml(marked(content));
  }, [content]);

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">要件定義書プレビュー</h2>
        <button
          onClick={onDownload}
          className="btn btn-success"
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

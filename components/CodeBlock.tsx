
import React from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">{language}</span>
      </div>
      <pre className="p-4 text-sm text-slate-200 overflow-x-auto">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;

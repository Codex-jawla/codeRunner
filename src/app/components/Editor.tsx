'use client';
import Editor from "@monaco-editor/react";
import { useEffect } from "react";
import { loader } from "@monaco-editor/react";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function CodeEditor({ language, code, setCode }: any) {
  useEffect(() => {
    loader.init().then((monaco) => {
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      
    });
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy!');
    }
  };

  return (
     <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-4 text-sm text-gray-400">main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'java' ? 'java' : 'cpp'}</span>
              </div>
              <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded">
                <Copy className="w-4 h-4 text-gray-400" />
              </button> 
             </div> 
    <div className="bg-[#161b22] rounded p-2">
      <Editor
        height="80vh"
        theme="vs-dark"
        defaultLanguage={language}
        value={code}
        onChange={(value) => setCode(value)}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "all",
          contextmenu: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
        }}
        loading={<div className="text-white">Loading editor...</div>}
      />
    </div>
  </div>
  );
}


            
  
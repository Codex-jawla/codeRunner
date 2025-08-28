import { Copy } from "lucide-react";
export default function OutputPanel({ output }: any) {
  return (
    
     <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="font-bold text-lg">Output</h2>
             
              </div>
              <button className="p-1 hover:bg-white/10 rounded">
                <Copy className="w-4 h-4 text-gray-400" />
              </button> 
             </div> 
              <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
          </div>   
  );
}

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="rounded-lg overflow-hidden text-sm my-2 border border-gray-700">
            <div className="bg-gray-800 text-gray-400 px-4 py-1.5 text-xs font-mono border-b border-gray-700 flex justify-between items-center">
                <span>{language || 'text'}</span>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="bg-[#1e1e1e] p-4 overflow-x-auto m-0 text-gray-300 font-mono">
                <code>{code}</code>
            </pre>
        </div>
    );
}

export default function CodeBlock({ code, language }) {
    return (
        <div className="rounded-lg overflow-hidden text-sm my-2 border border-gray-700">
            <div className="bg-gray-800 text-gray-400 px-4 py-1 text-xs font-mono border-b border-gray-700 flex justify-between">
                <span>{language || 'text'}</span>
                <span className="cursor-pointer hover:text-white">Copy</span>
            </div>
            <pre className="bg-[#1e1e1e] p-4 overflow-x-auto m-0 text-gray-300 font-mono">
                <code>{code}</code>
            </pre>
        </div>
    );
}

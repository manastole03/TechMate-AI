// RightSidebar: shows chat history with actions, search and filters
import React, { useMemo, useState } from 'react';
import { useChat } from '../state/chatStore.jsx';
import { Pin, PinOff, FileText, FileDown, Edit2, Trash2 } from 'lucide-react';

export default function RightSidebar() {
  const {
    chatsById,
    sessionsByCategory,
    historySearch,
    setHistorySearch,
    filterTool,
    setFilterTool,
    filterModel,
    setFilterModel,
    renameChat,
    deleteChat,
    pinChat,
    exportMarkdown,
    exportPDF,
    setActiveChatId,
    setActiveCategory,
  } = useChat();

  const [renameId, setRenameId] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const allChats = useMemo(() => {
    const items = Object.values(chatsById || {});
    // filter
    return items
      .filter((c) => (filterTool ? c.category === filterTool : true))
      .filter((c) => (filterModel ? c.modelId === filterModel : true))
      .filter((c) =>
        historySearch
          ? (c.title || '').toLowerCase().includes(historySearch.toLowerCase()) ||
          c.messages.some((m) => m.content.toLowerCase().includes(historySearch.toLowerCase()))
          : true
      )
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [chatsById, historySearch, filterTool, filterModel]);

  return (
    <aside className="h-full glass w-80 transition-all duration-300 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-200/60 dark:border-white/10">
        <div className="font-semibold">History</div>
        <div className="mt-2 flex gap-2">
          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search chats"
            className="flex-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5"
          />
        </div>
        {/* <div className="mt-2 flex gap-2">
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="flex-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5"
          >
            <option value="">All Tools</option>
            {Object.keys(sessionsByCategory).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="flex-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5"
          >
            <option value="">All Models</option>
            <option value="gpt-5">GPT-5</option>
            <option value="claude-35">Claude 3.5</option>
            <option value="gemini">Gemini 1.5</option>
            <option value="mistral">Mistral</option>
            <option value="llama-3">Llama 3</option>
          </select>
        </div> */}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {allChats.map((chat) => (
          <div key={chat.id} className="glass rounded-md p-2">
            <div className="flex items-start justify-between gap-2">
              <button
                className="text-left font-medium hover:underline"
                onClick={() => {
                  setActiveCategory(chat.category);
                  setActiveChatId(chat.id);
                }}
              >
                {chat.title}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(chat.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{chat.category} • {chat.modelId}</div>
            <div className="mt-2 flex gap-1">
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => pinChat(chat.id, !chat.pinned)}
                title={chat.pinned ? 'Unpin' : 'Pin'}
                aria-label={chat.pinned ? 'Unpin' : 'Pin'}
              >
                {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => exportMarkdown(chat.id)}
                title="Export Markdown"
                aria-label="Export Markdown"
              >
                <FileText size={14} />
              </button>
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => exportPDF(chat.id)}
                title="Export PDF"
                aria-label="Export PDF"
              >
                <FileDown size={14} />
              </button>
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => {
                  setRenameId(chat.id);
                  setRenameValue(chat.title);
                }}
                title="Rename"
                aria-label="Rename"
              >
                <Edit2 size={14} />
              </button>
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => deleteChat(chat.id)}
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {renameId === chat.id && (
              <div className="mt-2 flex gap-2">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5"
                />
                <button
                  className="btn-primary px-2 py-1 text-xs"
                  onClick={() => {
                    renameChat(chat.id, renameValue || chat.title);
                    setRenameId('');
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
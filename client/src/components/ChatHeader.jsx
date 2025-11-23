import { useState } from 'react';
import { MODELS, getModelInfo } from '../utils/models';
import { useChat } from '../state/chatStore.jsx';
import { Share2, Trash2, Download, Edit2, GitCompare, X } from 'lucide-react';

export default function ChatHeader({ chat }) {
  const { CATEGORIES, sessionsByCategory, setActiveCategory, setActiveChatId, createChat, chooseModel, toggleCompareModel, renameChat, exportChat, deleteChat, shareChat } = useChat();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const [compareOpen, setCompareOpen] = useState(false);

  const model = getModelInfo(chat.modelId);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-white/10">
      <div className="flex items-center gap-3">
        {renaming ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setRenaming(false);
              renameChat(chat.id, title || chat.title);
            }}
            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5"
          />
        ) : (
          <div className="text-lg font-semibold" onDoubleClick={() => setRenaming(true)}>{chat.title}</div>
        )}
        <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">{chat.category}</div>
        {/* Mobile category picker */}
        <select
          className="block sm:hidden px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-xs"
          value={chat.category}
          onChange={(e) => {
            const cat = e.target.value;
            setActiveCategory(cat);
            const list = sessionsByCategory[cat] || [];
            if (list.length === 0) {
              createChat(cat);
            } else {
              setActiveChatId(list[0]);
            }
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative group">
          <select
            value={chat.modelId}
            onChange={(e) => chooseModel(chat.id, e.target.value)}
            className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5"
            title={`${model.label}: Speed ${model.speed}, Reasoning ${model.reasoning}, Creativity ${model.creativity}`}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <div className="absolute hidden group-hover:block top-full mt-1 text-xs glass px-2 py-1 rounded-md">
            <div className="font-medium">{model.label}</div>
            <div>Speed: {model.speed}</div>
            <div>Reasoning: {model.reasoning}</div>
            <div>Creativity: {model.creativity}</div>
          </div>
        </div>

        {/* Multi-model compare selector */}
        <div className="relative">
          <button
            className="btn-ghost px-2 py-1"
            onClick={() => setCompareOpen((v) => !v)}
            title="Compare models"
            aria-label="Compare models"
          >
            <GitCompare size={16} />
          </button>
          {compareOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 glass rounded-md shadow-lg p-2 z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Compare models</div>
                <button className="btn-ghost px-1" onClick={() => setCompareOpen(false)} aria-label="Close"><X size={14} /></button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {MODELS.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(chat.selectedModelIds) ? chat.selectedModelIds.includes(m.id) : false}
                      onChange={() => toggleCompareModel(chat.id, m.id)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Send runs on all checked models.</div>
            </div>
          )}
        </div>

        {/* Selected model chips */}
        <div className="hidden md:flex items-center gap-1">
          {(Array.isArray(chat.selectedModelIds) ? chat.selectedModelIds : []).map((mid) => {
            const info = getModelInfo(mid);
            return (
              <span key={mid} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-white/10">
                {info.label}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button className="btn-ghost px-2 py-1" onClick={() => setRenaming(true)} title="Rename" aria-label="Rename">
            <Edit2 size={16} />
          </button>
          <button className="btn-ghost px-2 py-1" onClick={() => exportChat(chat.id)} title="Export JSON" aria-label="Export JSON">
            <Download size={16} />
          </button>
          <button className="btn-ghost px-2 py-1" onClick={() => shareChat(chat.id)} title="Share" aria-label="Share">
            <Share2 size={16} />
          </button>
          <button className="btn-ghost px-2 py-1" onClick={() => deleteChat(chat.id)} title="Delete" aria-label="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
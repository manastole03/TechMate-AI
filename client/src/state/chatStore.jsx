import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { getSocket, joinRoom as socketJoin, leaveRoom as socketLeave, sendRoomMessage, onPresence, onRoomMessage } from '../lib/socket';
import { DEFAULT_MODEL_ID, getModelInfo } from '../utils/models';
import { generateId, loadChats, saveChats, loadSettings, saveSettings } from '../utils/storage';

const CATEGORIES = [
  'Job Search',
  'Resume Compatibility',
  'Write for Me',
  'AI Humanizer',
  'Assignment Helper',
  'Code Writer',
  // Added options
  'General Chat',
  'Brainstorm',
  'Research Assistant',
  'Email Writer',
  'SQL Helper',
];


const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatsById, setChatsById] = useState({});
  const [sessionsByCategory, setSessionsByCategory] = useState(() => {
    const init = {};
    for (const c of CATEGORIES) init[c] = [];
    return init;
  });
  // right-sidebar filters
  const [historySearch, setHistorySearch] = useState('');
  const [filterTool, setFilterTool] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) return JSON.parse(saved);
    return { id: `u-${Math.random().toString(36).slice(2, 8)}`, name: 'Guest' };
  });
  const [roomId, setRoomId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [selfCheckMode, setSelfCheckMode] = useState(false);

  // load persisted
  useEffect(() => {
    const saved = loadChats();
    const settings = loadSettings();
    if (saved && saved.chatsById && saved.sessionsByCategory) {
      setChatsById(saved.chatsById);
      setSessionsByCategory(saved.sessionsByCategory);
      setActiveCategory(saved.activeCategory || CATEGORIES[0]);
      setActiveChatId(saved.activeChatId || null);
    }
    if (settings && settings.modelId) setModelId(settings.modelId);
  }, []);

  useEffect(() => {
    saveSettings({ modelId });
  }, [modelId]);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    saveChats({ chatsById, sessionsByCategory, activeCategory, activeChatId });
  }, [chatsById, sessionsByCategory, activeCategory, activeChatId]);

  // socket setup when user changes
  useEffect(() => {
    const s = getSocket(currentUser);
    function onConnect() { setSocketReady(true); }
    s.on('connect', onConnect);
    return () => { s.off('connect', onConnect); };
  }, [currentUser]);

  // Import shared chat via URL (?shared=base64json)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get('shared');
      if (shared) {
        const decoded = JSON.parse(atob(shared));
        const id = generateId('chat');
        const category = decoded.category || 'General Chat';
        const chat = {
          id,
          title: decoded.title || `Shared Chat`,
          category,
          modelId: decoded.modelId || DEFAULT_MODEL_ID,
          messages: Array.isArray(decoded.messages) ? decoded.messages : [],
          updatedAt: Date.now(),
        };
        setChatsById((prev) => ({ ...prev, [id]: chat }));
        setSessionsByCategory((prev) => ({ ...prev, [category]: [id, ...(prev[category] || [])] }));
        setActiveCategory(category);
        setActiveChatId(id);
        // remove the param so it doesn't import again on refresh
        params.delete('shared');
        const base = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', base);
      }
    } catch { }
  }, []);

  const createChat = (category) => {
    const id = generateId('chat');
    const title = `${category} Chat`;
    const chat = {
      id,
      title,
      category,
      modelId,
      selectedModelIds: [],
      messages: [],
      pinned: false,
      updatedAt: Date.now(),
    };
    setChatsById((prev) => ({ ...prev, [id]: chat }));
    setSessionsByCategory((prev) => ({ ...prev, [category]: [id, ...prev[category]] }));
    setActiveCategory(category);
    setActiveChatId(id);
  };

  const renameChat = (chatId, title) => {
    setChatsById((prev) => ({ ...prev, [chatId]: { ...prev[chatId], title } }));
  };

  const deleteChat = (chatId) => {
    setChatsById((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    setSessionsByCategory((prev) => {
      const next = { ...prev };
      for (const c of CATEGORIES) next[c] = next[c].filter((id) => id !== chatId);
      return next;
    });
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const exportChat = (chatId) => {
    const chat = chatsById[chatId];
    if (!chat) return;
    const blob = new Blob([JSON.stringify(chat, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${chat.title || chat.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportMarkdown = (chatId) => {
    const chat = chatsById[chatId];
    if (!chat) return;
    const header = `# ${chat.title}\n\nTool: ${chat.category}\nModel: ${chat.modelId}\nDate: ${new Date(chat.updatedAt).toLocaleString()}\n\n`;
    const body = chat.messages
      .map((m) => `**${m.role === 'user' ? 'User' : 'Assistant'}:**\n\n${m.content}\n`)
      .join('\n');
    const md = header + body;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${chat.title || chat.id}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPDF = (chatId) => {
    const chat = chatsById[chatId];
    if (!chat) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;
    doc.setFontSize(16);
    doc.text(chat.title, margin, y);
    y += 24;
    doc.setFontSize(10);
    doc.text(`Tool: ${chat.category}  •  Model: ${chat.modelId}  •  ${new Date(chat.updatedAt).toLocaleString()}`, margin, y);
    y += 20;
    doc.setFontSize(12);
    chat.messages.forEach((m) => {
      const who = m.role === 'user' ? 'User' : 'Assistant';
      const lines = doc.splitTextToSize(`${who}: ${m.content}`, 540);
      lines.forEach((line) => {
        if (y > 780) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 16;
      });
      y += 8;
    });
    doc.save(`${chat.title || chat.id}.pdf`);
  };

  const pinChat = (chatId, pinned = true) => {
    setChatsById((prev) => ({ ...prev, [chatId]: { ...prev[chatId], pinned } }));
  };

  const sendMessage = async (chatId, content) => {
    const chat = chatsById[chatId];
    if (!chat) return;
    const userMsg = { role: 'user', content, chatId, createdAt: Date.now() };
    const primaryModel = getModelInfo(chat.modelId);
    setChatsById((prev) => ({ ...prev, [chatId]: { ...prev[chatId], messages: [...prev[chatId].messages, userMsg], updatedAt: Date.now() } }));
    // If in a room, let server handle AI and broadcast (still non-streaming for now)
    if (roomId) {
      const history = [{ role: 'system', content: 'You are a helpful assistant.' }, ...chatsById[chatId].messages.map((m) => ({ role: m.role, content: m.content }))];
      sendRoomMessage({ roomId, content, history, model: primaryModel.engine });
    } else {
      try {
        const modelsToRun = (chat.selectedModelIds && chat.selectedModelIds.length > 0)
          ? chat.selectedModelIds
          : [chat.modelId];
        const now = Date.now();

        // Add a pending assistant bubble per model
        setChatsById((prev) => ({
          ...prev,
          [chatId]: {
            ...prev[chatId],
            messages: [
              ...prev[chatId].messages,
              ...modelsToRun.map((mid, idx) => ({ role: 'assistant', content: '', chatId, createdAt: now + idx, pending: true, modelUsed: mid })),
            ],
            updatedAt: Date.now(),
          },
        }));

        const baseHistory = [
          { role: 'system', content: 'You are a helpful assistant.' },
          ...chatsById[chatId].messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ];

        await Promise.all(modelsToRun.map(async (mid) => {
          const modelInfo = getModelInfo(mid);
          try {
            const r = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: baseHistory, model: modelInfo.engine, stream: true }),
            });

            if (!r.ok) {
              const j = await r.json();
              throw new Error(j.detail || j.error || 'Upstream error');
            }

            const reader = r.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop(); // Keep the last partial line

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta?.content || '';
                    if (delta) {
                      fullContent += delta;
                      // Update state with new chunk
                      setChatsById((prev) => {
                        const msgs = [...prev[chatId].messages];
                        for (let i = msgs.length - 1; i >= 0; i--) {
                          const m = msgs[i];
                          if (m.role === 'assistant' && m.pending && m.modelUsed === mid && !m.isCritique) {
                            msgs[i] = { ...m, content: fullContent };
                            break;
                          }
                        }
                        return { ...prev, [chatId]: { ...prev[chatId], messages: msgs, updatedAt: Date.now() } };
                      });
                    }
                  } catch (e) {
                    console.error('Error parsing stream chunk', e);
                  }
                }
              }
            }

            // Finalize message (remove pending)
            setChatsById((prev) => {
              const msgs = [...prev[chatId].messages];
              for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                if (m.role === 'assistant' && m.pending && m.modelUsed === mid && !m.isCritique) {
                  msgs[i] = { ...m, content: fullContent, pending: false };
                  break;
                }
              }
              return { ...prev, [chatId]: { ...prev[chatId], messages: msgs, updatedAt: Date.now() } };
            });

          } catch (e) {
            setChatsById((prev) => {
              const msgs = [...prev[chatId].messages];
              let replaced = false;
              for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                if (m.role === 'assistant' && m.pending && m.modelUsed === mid && !m.isCritique) {
                  msgs[i] = { ...m, content: `Error: ${String(e)}`, pending: false, createdAt: Date.now() };
                  replaced = true;
                  break;
                }
              }
              if (!replaced) msgs.push({ role: 'assistant', content: `Error: ${String(e)}`, chatId, createdAt: Date.now(), modelUsed: mid });
              return { ...prev, [chatId]: { ...prev[chatId], messages: msgs, updatedAt: Date.now() } };
            });
          }
        }));
      } catch (e) {
        // General error fallback
        console.error(e);
      }
    }
  };

  const chooseModel = (chatId, nextModelId) => {
    setChatsById((prev) => ({ ...prev, [chatId]: { ...prev[chatId], modelId: nextModelId } }));
  };

  const toggleCompareModel = (chatId, modelId) => {
    setChatsById((prev) => {
      const chat = prev[chatId];
      if (!chat) return prev;
      const current = Array.isArray(chat.selectedModelIds) ? chat.selectedModelIds : [];
      const exists = current.includes(modelId);
      const next = exists ? current.filter((id) => id !== modelId) : [...current, modelId];
      return { ...prev, [chatId]: { ...chat, selectedModelIds: next } };
    });
  };

  const regenerateLast = async (chatId) => {
    const chat = chatsById[chatId];
    if (!chat) return;
    const msgs = chat.messages || [];
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') { lastUserIndex = i; break; }
    }
    if (lastUserIndex < 0) return;
    const userContent = msgs[lastUserIndex].content;
    const modelsToRun = (chat.selectedModelIds && chat.selectedModelIds.length > 0) ? chat.selectedModelIds : [chat.modelId];

    setChatsById((prev) => {
      const current = prev[chatId];
      if (!current) return prev;
      const nextMsgs = [...current.messages];
      const seen = new Set();
      // Reset existing pending/last assistant messages
      for (let i = nextMsgs.length - 1; i > lastUserIndex; i--) {
        const m = nextMsgs[i];
        if (m.role === 'assistant' && !m.isCritique) {
          const mid = m.modelUsed || current.modelId;
          if (!seen.has(mid)) {
            nextMsgs[i] = { ...m, content: '', pending: true, createdAt: Date.now() };
            seen.add(mid);
          }
        }
      }
      // Add missing ones
      modelsToRun.forEach((mid) => {
        if (!seen.has(mid)) {
          nextMsgs.push({ role: 'assistant', content: '', chatId, createdAt: Date.now(), pending: true, modelUsed: mid });
        }
      });
      return { ...prev, [chatId]: { ...current, messages: nextMsgs, updatedAt: Date.now() } };
    });

    const baseHistory = [
      { role: 'system', content: 'You are a helpful assistant.' },
      ...msgs.slice(0, lastUserIndex + 1).map((m) => ({ role: m.role, content: m.content })),
    ];

    await Promise.all(modelsToRun.map(async (mid) => {
      const modelInfo = getModelInfo(mid);
      try {
        const r = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: baseHistory, model: modelInfo.engine, stream: true }),
        });

        if (!r.ok) {
          const j = await r.json();
          throw new Error(j.detail || j.error || 'Upstream error');
        }

        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const delta = json.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  setChatsById((prev) => {
                    const next = { ...prev };
                    const cm = [...next[chatId].messages];
                    for (let i = cm.length - 1; i > lastUserIndex; i--) {
                      const m = cm[i];
                      if (m.role === 'assistant' && m.pending && (m.modelUsed || next[chatId].modelId) === mid && !m.isCritique) {
                        cm[i] = { ...m, content: fullContent };
                        break;
                      }
                    }
                    next[chatId] = { ...next[chatId], messages: cm, updatedAt: Date.now() };
                    return next;
                  });
                }
              } catch (e) {
                console.error('Error parsing stream chunk', e);
              }
            }
          }
        }

        // Finalize
        setChatsById((prev) => {
          const next = { ...prev };
          const cm = [...next[chatId].messages];
          for (let i = cm.length - 1; i > lastUserIndex; i--) {
            const m = cm[i];
            if (m.role === 'assistant' && m.pending && (m.modelUsed || next[chatId].modelId) === mid && !m.isCritique) {
              cm[i] = { ...m, content: fullContent, pending: false };
              break;
            }
          }
          next[chatId] = { ...next[chatId], messages: cm, updatedAt: Date.now() };
          return next;
        });

      } catch (e) {
        setChatsById((prev) => {
          const next = { ...prev };
          const cm = [...next[chatId].messages];
          for (let i = cm.length - 1; i > lastUserIndex; i--) {
            const m = cm[i];
            if (m.role === 'assistant' && m.pending && (m.modelUsed || next[chatId].modelId) === mid && !m.isCritique) {
              cm[i] = { ...m, content: `Error: ${String(e)}`, pending: false, createdAt: Date.now() };
              break;
            }
          }
          next[chatId] = { ...next[chatId], messages: cm, updatedAt: Date.now() };
          return next;
        });
      }
    }));
  };

  const shareChat = async (chatId) => {
    const chat = chatsById[chatId];
    if (!chat) return;
    const payload = btoa(
      JSON.stringify({ title: chat.title, category: chat.category, modelId: chat.modelId, messages: chat.messages })
    );
    const url = `${window.location.origin}${window.location.pathname}?shared=${encodeURIComponent(payload)}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard');
    } catch {
      if (navigator.share) {
        try {
          await navigator.share({ title: chat.title, url });
        } catch { }
      } else {
        alert(url);
      }
    }
  };

  // Room controls
  const createRoom = () => {
    const id = `room-${Math.random().toString(36).slice(2, 6)}${Math.random().toString(16).slice(2, 6)}`;
    setRoomId(id);
    socketJoin(id);
  };
  const joinRoom = (id) => {
    if (!id) return;
    setRoomId(id);
    socketJoin(id);
  };
  const leaveRoom = () => {
    if (roomId) socketLeave(roomId);
    setRoomId('');
    setParticipants([]);
  };

  useEffect(() => {
    const offPresence = onPresence((p) => {
      setParticipants((prev) => {
        const exists = prev.find((u) => u.id === p.user.id);
        if (p.type === 'join' && !exists) return [...prev, p.user];
        if (p.type === 'leave') return prev.filter((u) => u.id !== p.user.id);
        return prev;
      });
    });
    const offMsg = onRoomMessage((m) => {
      if (!activeChatId) return;
      const msg = { role: m.role, content: m.content, chatId: activeChatId, createdAt: Date.now() };
      setChatsById((prev) => ({ ...prev, [activeChatId]: { ...prev[activeChatId], messages: [...prev[activeChatId].messages, msg], updatedAt: Date.now() } }));
    });
    return () => { offPresence(); offMsg(); };
  }, [activeChatId]);

  const toggleVoiceMode = () => setVoiceMode((v) => !v);
  const toggleSelfCheck = () => setSelfCheckMode((v) => !v);

  const value = useMemo(
    () => ({
      CATEGORIES,
      sidebarCollapsed,
      setSidebarCollapsed,
      modelId,
      setModelId,
      activeCategory,
      setActiveCategory,
      activeChatId,
      setActiveChatId,
      chatsById,
      sessionsByCategory,
      historySearch,
      setHistorySearch,
      filterTool,
      setFilterTool,
      filterModel,
      setFilterModel,
      currentUser,
      setCurrentUser,
      roomId,
      participants,
      createRoom,
      joinRoom,
      leaveRoom,
      voiceMode,
      toggleVoiceMode,
      selfCheckMode,
      toggleSelfCheck,
      createChat,
      renameChat,
      deleteChat,
      exportChat,
      exportMarkdown,
      exportPDF,
      sendMessage,
      chooseModel,
      toggleCompareModel,
      regenerateLast,
      shareChat,
      pinChat,
    }),
    [sidebarCollapsed, modelId, activeCategory, activeChatId, chatsById, sessionsByCategory, historySearch, filterTool, filterModel, currentUser, roomId, participants, voiceMode, selfCheckMode]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
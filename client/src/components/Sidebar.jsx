import { useChat } from '../state/chatStore.jsx';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Sidebar() {
  const {
    CATEGORIES,
    sidebarCollapsed,
    setSidebarCollapsed,
    sessionsByCategory,
    chatsById,
    createChat,
    setActiveChatId,
    setActiveCategory,
    activeCategory,
    roomId,
    participants,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useChat();

  return (
    <aside
      className={clsx(
        'h-full glass transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-72'
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200/60 dark:border-white/10">
        <div className="font-semibold">Workspace</div>
        <div className="flex items-center gap-1">
          {!sidebarCollapsed && (
            <button
              className="btn-ghost px-2 py-1 text-sm"
              title="New Chat"
              aria-label="New Chat"
              onClick={() => createChat(activeCategory)}
            >
              <Plus size={16} />
            </button>
          )}
          <button
            className="btn-ghost px-2 py-1 text-sm"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <div className="p-2 overflow-y-auto h-[calc(100%-48px)]">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <button
              className="sidebar-title w-full text-left hover:underline"
              onClick={() => {
                // Set active category and create/open a chat
                setActiveCategory(cat);
                const list = sessionsByCategory[cat] || [];
                if (list.length === 0) {
                  // Create a single chat if none exist to avoid duplicates
                  createChat(cat);
                } else {
                  // Open the most recent chat in this category
                  setActiveChatId(list[0]);
                }
              }}
              title="Create a new chat in this category"
            >
              {cat}
            </button>

          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-white/10">
          <div className="sidebar-title">Collaborative Chat</div>
          <div className="flex gap-2">
            <button className="btn-primary px-5 py-1 text-sm" onClick={createRoom}>Try Codexa.ai</button>
            {/* <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const id = e.currentTarget.roomid.value.trim();
                if (id) joinRoom(id);
                e.currentTarget.reset();
              }}
            >
              <input name="roomid" placeholder="room-xxxx" className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 w-24 text-sm" />
              <button className="btn-ghost px-3 py-1 text-sm" type="submit">Join</button>
            </form> */}
          </div>

          {roomId ? (
            <div className="mt-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Connected to: {roomId}</div>
              <div className="mt-2 flex -space-x-2">
                {participants.map((p) => (
                  <div key={p.id} className="w-7 h-7 rounded-full glass text-xs flex items-center justify-center border border-gray-200 dark:border-gray-800" title={p.name}>
                    {p.name?.slice(0, 1) || 'U'}
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button className="btn-ghost px-3 py-1 text-sm text-red-400 hover:text-red-500" onClick={leaveRoom}>Leave Room</button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Collaborate, Create, & Code — <br></br> Together in Real Time !!</div>
          )}
        </div>
      </div>
    </aside >
  );
}
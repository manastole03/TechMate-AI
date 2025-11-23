import { useEffect, useRef } from 'react';
import { useChat } from '../state/chatStore.jsx';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import CategoryTools from './CategoryTools';
import WorkflowBuilder from './WorkflowBuilder';
import { getModelInfo } from '../utils/models';

export default function ChatWindow() {
  const { activeChatId, chatsById, sendMessage } = useChat();
  const chat = activeChatId ? chatsById[activeChatId] : null;
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat?.messages?.length]);

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center glass">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Start a chat</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Choose a category from the sidebar</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass">
      <ChatHeader chat={chat} />
      <div ref={listRef} className="flex-1 overflow-y-auto py-3 sm:py-4 custom-scrollbar">
        <CategoryTools category={chat.category} chatId={chat.id} />
        <div className="mx-auto w-full md:max-w-3xl px-2 sm:px-4 space-y-6">
          {chat.messages && chat.messages.length > 0 ? (
            chat.messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                pending={m.pending}
                timestamp={m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}
                modelLabel={m.role === 'assistant' ? getModelInfo(m.modelUsed || chat.modelId).label : ''}
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <div className="text-4xl mb-4">✨</div>
              <p>Start a conversation...</p>
            </div>
          )}
        </div>
      </div>
      <Composer chatId={chat.id} />
      <WorkflowBuilder category={chat.category} />
    </div>
  );
}
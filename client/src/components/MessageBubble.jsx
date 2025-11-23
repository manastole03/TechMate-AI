// MessageBubble: ChatGPT/Claude-style bubble with avatar, copy action, markdown
import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, User, Bot } from 'lucide-react';
import 'highlight.js/styles/github.css';
import clsx from 'clsx';

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-1 h-6">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

export default function MessageBubble({ role, content, timestamp, pending, modelLabel }) {
  const isUser = role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={clsx(
        "flex items-end gap-3 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shrink-0"
        >
          <Bot size={18} />
        </motion.div>
      )}

      <div className={clsx(
        "max-w-[85%] md:max-w-[75%] relative group",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={clsx(
          "rounded-2xl px-5 py-3.5 shadow-md backdrop-blur-sm",
          isUser
            ? "bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm"
            : "bg-white/80 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-white/20"
        )}>
          {!isUser && modelLabel && (
            <div className="text-[10px] font-medium text-indigo-500 dark:text-indigo-300 mb-1 opacity-80 uppercase tracking-wider">
              {modelLabel}
            </div>
          )}

          <div className="markdown-body text-sm sm:text-base leading-relaxed">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {content}
              </ReactMarkdown>
            ) : pending ? (
              <TypingIndicator />
            ) : null}
            {pending && content && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-1.5 h-4 ml-1 align-middle bg-current"
              />
            )}
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(content || '')}
            className={clsx(
              "absolute top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10",
              isUser ? "left-2 text-white/80" : "right-2 text-gray-500 dark:text-gray-400"
            )}
            title="Copy message"
          >
            <Copy size={14} />
          </button>
        </div>

        {timestamp && (
          <div className={clsx(
            "text-[10px] text-gray-400 mt-1 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {timestamp}
          </div>
        )}
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg shrink-0"
        >
          <User size={18} />
        </motion.div>
      )}
    </motion.div>
  );
}
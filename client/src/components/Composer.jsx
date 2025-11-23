import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Mic, MicOff, ArrowUpCircle, Sparkles, RotateCcw, Wand2, X } from 'lucide-react';
import { useChat } from '../state/chatStore.jsx';
import PromptOptimizer from './PromptOptimizer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker from CDN to avoid bundler complexities
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function Composer({ chatId }) {
  const { chatsById, sendMessage, regenerateLast } = useChat();
  const chat = chatsById[chatId];
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const hasVoiceSupport = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
  const [showPromptPanel, setShowPromptPanel] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);

  const PROMPT_LIBRARY = {
    'Job Search': [
      'Tailor these resume bullets for a Product Manager role.',
      'Draft a concise cover letter for this job description.',
      'Create mock interview Q&A for this role.',
      'Summarize this company research into 5 takeaways.'
    ],
    'Write for Me': [
      'Rewrite this paragraph to be more concise and engaging.',
      'Convert these bullet points into a coherent narrative.',
      'Expand this note into 400 words with headings.',
      'Improve clarity and flow while keeping the original tone.'
    ],
    'AI Humanizer': [
      'Humanize this text: make it natural, friendly, and readable.',
      'Paraphrase to reduce AI detection while preserving meaning.',
      'Adjust tone to conversational and add subtle personality.',
      'Rewrite with varied sentence structure and idiomatic phrases.'
    ],
    'Assignment Helper': [
      'Create an outline with thesis and key points for this essay.',
      'Explain this concept simply with examples.',
      'Generate study questions and answers from this text.',
      'Summarize and derive 3 insights and 2 questions.'
    ],
    'Code Writer': [
      'Write a function with unit tests for this requirement.',
      'Refactor this code for readability and performance.',
      'Explain time and space complexity step by step.',
      'Provide a minimal reproducible example with comments.'
    ],
    'General Chat': [
      'Summarize the following into key points and action items.',
      'Give a high-level overview with headings and bullets.',
      'Turn this into a checklist of steps.',
      'Extract definitions and examples for core terms.'
    ],
    'Brainstorm': [
      'List 10 creative ideas with pros and cons.',
      'Generate 5 approaches with assumptions and risks.',
      'Give variations across tones, audiences, and lengths.',
      'Create a mind map outline from this topic.'
    ],
    'Research Assistant': [
      'Summarize sources and cite key findings.',
      'Compare viewpoints and synthesize a conclusion.',
      'Extract quotes and themes from this text.',
      'Produce an annotated bibliography.'
    ],
    'Email Writer': [
      'Draft a professional email with clear ask and next steps.',
      'Politely decline with appreciation and alternative.',
      'Follow up on previous conversation with context.',
      'Write a friendly reminder with deadline.'
    ],
    'SQL Helper': [
      'Write a SQL query for this requirement with explanation.',
      'Optimize this query and explain indexes to add.',
      'Create schema and sample data for this scenario.',
      'Convert this question into SQL and outline assumptions.'
    ],
    __default: [
      'Summarize the following text into bullet points.',
      'Explain simply with examples and analogies.',
      'Rewrite to be concise and clear.',
      'List action items and key takeaways.'
    ]
  };

  // Robust fallback for suggestions
  const promptSuggestions = (chat?.category && PROMPT_LIBRARY[chat.category])
    ? PROMPT_LIBRARY[chat.category]
    : PROMPT_LIBRARY['General Chat'] || PROMPT_LIBRARY.__default;

  const suggestions = promptSuggestions.slice(0, 4);

  const doSend = () => {
    const text = (value || '').trim();
    if (!text) return;
    sendMessage(chatId, text);
    setValue('');
  };

  // Voice recognition setup
  useEffect(() => {
    if (!hasVoiceSupport) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue((prev) => {
        const next = (prev ? prev + ' ' : '') + transcript.trim();
        return next.trim();
      });
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch { }
    };
  }, [hasVoiceSupport]);

  const toggleVoice = () => {
    if (!hasVoiceSupport) return alert('Voice input is not supported in this browser.');
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      try { rec.stop(); } catch { }
      setListening(false);
    } else {
      try { rec.start(); setListening(true); } catch { setListening(false); }
    }
  };

  // PDF text extraction
  async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const textChunks = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((i) => i.str);
      textChunks.push(strings.join(' '));
    }
    return textChunks.join('\n\n');
  }

  return (
    <>
      <div className="relative border-t border-gray-200/60 dark:border-white/10 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {(!chat?.messages || chat.messages.length === 0) && (
          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700 transition-colors"
                onClick={() => {
                  setValue(s);
                  sendMessage(chatId, s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Prompts Panel - Positioned Absolute to the Composer Container */}
        {showPromptPanel && (
          <div className="absolute bottom-full left-4 mb-2 w-[min(500px,90vw)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-40 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                Suggested Prompts
              </span>
              <button onClick={() => setShowPromptPanel(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
              {promptSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg transition-colors mb-1 last:mb-0 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                  onClick={() => {
                    setValue(s);
                    setShowPromptPanel(false);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/50 transition-all">
          <div className="flex items-start p-3 gap-3">
            <label className="mt-1 p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors" title="Attach file">
              <Paperclip size={20} />
              <input
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                      const text = await file.text();
                      sendMessage(chatId, `Uploaded file: ${file.name}\n\n${text}`);
                    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                      const text = await extractPdfText(file);
                      const trimmed = text.length > 15000 ? text.slice(0, 15000) + '\n\n[truncated]' : text;
                      sendMessage(
                        chatId,
                        `Uploaded PDF: ${file.name}\n\n${trimmed}\n\nPlease read and summarize the key points.`
                      );
                    } else {
                      sendMessage(chatId, `Uploaded file: ${file.name} (${file.type || 'binary'})`);
                    }
                  } catch {
                    sendMessage(chatId, `Uploaded file: ${file.name}`);
                  }
                  e.target.value = '';
                }}
              />
            </label>

            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  doSend();
                }
              }}
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
              placeholder="Message the assistant..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 resize-none py-2"
            />

            {hasVoiceSupport && (
              <button
                className={`mt-1 p-2 rounded-lg transition-colors ${listening ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse ring-1 ring-red-200' : 'text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={toggleVoice}
                title={listening ? 'Stop recording' : 'Start voice input'}
              >
                {listening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-2 pb-2 pt-1 border-t border-gray-100 dark:border-gray-700/50 mx-2">
            <div className="flex items-center gap-1">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showPromptPanel ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                onClick={() => setShowPromptPanel((v) => !v)}
                title="Prompt Library"
              >
                <Sparkles size={14} />
                Prompts
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                onClick={() => {
                  if (value.trim()) {
                    setShowOptimizer(true);
                  } else {
                    alert('Please enter a prompt first');
                  }
                }}
                title="Optimize with AI"
              >
                <Wand2 size={14} />
                Optimize
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => regenerateLast(chatId)}
                title="Regenerate last response"
              >
                <RotateCcw size={18} />
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${value.trim() ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:shadow-lg hover:scale-105' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                onClick={doSend}
                disabled={!value.trim()}
              >
                Send
                <ArrowUpCircle size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-between text-[10px] text-gray-400 px-1">
          <span>Shift+Enter for newline • Enter to send</span>
          <span>{hasVoiceSupport ? 'Voice Active' : 'No Voice Support'}</span>
        </div>
      </div>

      {/* Prompt Optimizer Modal - Moved OUTSIDE the relative container */}
      {showOptimizer && (
        <PromptOptimizer
          originalPrompt={value}
          category={chat?.category}
          onSelectPrompt={(optimized) => {
            setValue(optimized);
            setShowOptimizer(false);
            inputRef.current?.focus();
          }}
          onClose={() => setShowOptimizer(false)}
        />
      )}
    </>
  );
}
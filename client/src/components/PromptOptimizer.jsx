import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, ArrowRight, Info, CheckCircle2, XCircle } from 'lucide-react';

/**
 * AI Prompt Optimizer Component
 * Analyzes user prompts and suggests optimized versions
 */
export default function PromptOptimizer({ originalPrompt, category, onSelectPrompt, onClose }) {
    const [analyzing, setAnalyzing] = useState(true);
    const [analysis, setAnalysis] = useState(null);

    React.useEffect(() => {
        if (originalPrompt) {
            analyzePrompt(originalPrompt, category);
        }
    }, [originalPrompt, category]);

    const analyzePrompt = (prompt, cat) => {
        // Simulate analysis (in production, this would call an AI service)
        setTimeout(() => {
            const issues = [];
            const suggestions = [];

            // Check for common issues
            if (prompt.length < 20) {
                issues.push({ type: 'length', message: 'Prompt is too short - add more context' });
            }
            if (!prompt.includes('?') && prompt.split(' ').length < 10) {
                issues.push({ type: 'clarity', message: 'No clear question or instruction' });
            }
            if (!/\b(please|help|generate|create|write|explain)\b/i.test(prompt)) {
                issues.push({ type: 'action', message: 'Missing action verb (e.g., "generate", "explain")' });
            }

            // Generate optimized versions based on category
            const categoryTemplates = {
                'Job Search': [
                    `Act as a career coach. ${prompt}. Provide specific, actionable advice with examples.`,
                    `I'm actively job searching. ${prompt}. Include: 1) Key skills to highlight, 2) Specific companies to target, 3) Networking strategies.`,
                    `${prompt}. Additionally, suggest 3 LinkedIn boolean search strings and 5 interview questions I should prepare for.`
                ],
                'Resume Compatibility': [
                    `Analyze the following for ATS compatibility: ${prompt}. Provide: 1) Compatibility score, 2) Missing keywords, 3) Rewrite suggestions.`,
                    `${prompt}. Compare my resume against the job description and identify gaps. Be brutally honest and provide copy-paste ready improvements.`,
                    `${prompt}. Focus on quantifiable achievements and suggest how to incorporate keywords naturally.`
                ],
                'Code Writer': [
                    `Write production-ready code for: ${prompt}. Include: 1) Full implementation, 2) Error handling, 3) Unit tests, 4) Documentation.`,
                    `${prompt}. Provide the code with inline comments explaining the logic, time/space complexity analysis, and alternative approaches.`,
                    `As a senior engineer, implement: ${prompt}. Follow best practices for [language] and include setup instructions.`
                ],
                '__default': [
                    `${prompt}. Be specific and provide actionable steps.`,
                    `Act as an expert. ${prompt}. Use examples and explain your reasoning.`,
                    `${prompt}. Structure your response with clear headings and bullet points for easy scanning.`
                ]
            };

            const templates = categoryTemplates[cat] || categoryTemplates['__default'];

            setAnalysis({
                issues,
                originalLength: prompt.length,
                optimizedPrompts: templates,
                improvements: [
                    'Added role/persona for better context',
                    'Structured output requirements',
                    'Requested specific examples and actionable advice'
                ]
            });
            setAnalyzing(false);
        }, 1500);
    };

    if (analyzing) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="text-indigo-600" size={48} />
                        </motion.div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">Analyzing Your Prompt...</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Applying prompt engineering best practices
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-[95vw] min-h-[70vh] my-8 flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wand2 className="text-white" size={28} />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Prompt Optimizer</h2>
                                <p className="text-indigo-100 text-sm">Choose an optimized version below</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <XCircle size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Issues Found */}
                    {analysis?.issues.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                        Areas for Improvement
                                    </h4>
                                    <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                                        {analysis.issues.map((issue, i) => (
                                            <li key={i}>• {issue.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Original Prompt */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                            Your Original Prompt
                        </label>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-800 dark:text-gray-200">
                            {originalPrompt}
                        </div>
                    </div>

                    {/* Optimized Versions */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                            Optimized Versions
                        </label>
                        <div className="space-y-3">
                            {analysis?.optimizedPrompts.map((prompt, index) => (
                                <motion.button
                                    key={index}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => onSelectPrompt(prompt)}
                                    className="w-full text-left bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg p-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                                                {prompt}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={14} />
                                                <span>Click to use this prompt</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Improvements Applied */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                    Optimizations Applied
                                </h4>
                                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                                    {analysis?.improvements.map((imp, i) => (
                                        <li key={i}>✓ {imp}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Keep Original
                        </button>
                        <button
                            onClick={() => onSelectPrompt(analysis?.optimizedPrompts[0])}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg"
                        >
                            Use Recommended
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Workflow, Play, CheckCircle, Circle,
    ArrowRight, X, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { useChat } from '../state/chatStore';

// Category-specific workflow templates
const WORKFLOW_TEMPLATES = {
    'Job Search': {
        name: 'Job Search Strategy',
        steps: [
            { title: 'Research Target Companies', prompt: 'Conduct a deep-dive research on [JOB_ROLE] positions.\n\nProvide a "Top-Notch" analysis including:\n1. 🏢 **Top 10 Companies** actively hiring (include links to careers pages if possible)\n2. 🌟 **Company Culture & Values** breakdown for each\n3. 💰 **Salary Ranges** (Real-time market data)\n4. 📈 **Growth Trajectories** & Recent News\n5. 🔗 **Useful Resources:** List 3-5 tools or sites for further research.\n\nFormat with clear headings and bullet points.' },
            { title: 'Optimize Resume', prompt: 'Based on the target companies, optimize my resume for [JOB_ROLE].\n\nProvide:\n1. 🔑 **Key Skills Matrix** (Hard & Soft Skills)\n2. 🏆 **5 "STAR" Method Bullet Points** (Situation, Task, Action, Result) that quantify impact\n3. 📝 **Tailored Summary** specifically for these companies\n4. 🤖 **ATS Optimization:** List specific keywords to include.\n5. 🔗 **Resources:** Link to 2-3 resume scanning tools.' },
            { title: 'Create Cover Letter Template', prompt: 'Draft a premium, high-converting cover letter for [JOB_ROLE].\n\nInclude:\n1. 🎣 **Opening Hook** that grabs attention immediately\n2. 💎 **Value Proposition** connecting my skills to their needs\n3. 🧩 **Customizable Placeholders** for specific company data\n4. 🚀 **Strong Call to Action (CTA)**\n5. 💡 **Pro Tip:** Advice on how to find the hiring manager\'s name.' },
            { title: 'Network Strategy', prompt: 'Design an elite networking strategy for [JOB_ROLE].\n\nProvide:\n1. 📨 **3 Outreach Templates** (Cold DM, Connection Request, Follow-up)\n2. 👥 **5 Communities/Groups** to join (LinkedIn, Slack, Discord)\n3. ☕ **Informational Interview Script** (Questions that impress)\n4. 📅 **Follow-up Sequence** timeline\n5. 🔗 **Resources:** Links to networking event platforms.' },
            { title: 'Interview Preparation', prompt: 'Prepare a masterclass interview guide for [JOB_ROLE].\n\nInclude:\n1. 🎤 **10 Behavioral Questions** with "Gold Standard" STAR answers\n2. 💻 **Technical/Role-Specific Questions** & Answers\n3. 🧠 **Questions to Ask the Interviewer** (Strategic & Insightful)\n4. 📧 **Post-Interview Thank You Email** template\n5. 📚 **Resources:** Links to mock interview platforms or salary negotiation guides.' }
        ]
    },
    'Resume Compatibility': {
        name: 'ATS Resume Optimization',
        steps: [
            { title: 'Parse Job Description', prompt: 'Analyze this job description deeply:\n\n[JOB_DESCRIPTION]\n\nExtract:\n1. 🎯 **Must-Have Skills** (Technical & Soft)\n2. 🌟 **Nice-to-Have Qualifications**\n3. 🕵️ **Hidden Requirements** (Reading between the lines)\n4. 🚩 **Red Flags** or concerns\n5. 🏢 **Culture Indicators**' },
            { title: 'Keyword Gap Analysis', prompt: 'Perform a detailed Gap Analysis against the job description.\n\nOutput:\n1. 🚨 **CRITICAL MISSING KEYWORDS** (Must add)\n2. ⚠️ **Important Keywords** (Should add)\n3. ✅ **Matching Keywords** (Keep these)\n4. 💡 **Action Plan:** Exactly where to insert the missing terms.\n5. 🔗 **Tools:** Recommend 2 free ATS scanners.' },
            { title: 'Bullet Point Rewrites', prompt: 'Rewrite my experience bullet points to be "Top 1%".\n\nRequirements:\n1. 🔢 **Quantify Results** (Use %, $, Time saved)\n2. 🚀 **Action Verbs** (Start every bullet strong)\n3. 🤖 **ATS Friendly** (Natural keyword integration)\n4. 🔄 **Before vs. After** comparison for 3 key bullets.\n5. 📚 **Resource:** Link to a list of power verbs.' },
            { title: 'ATS Formatting Check', prompt: 'Audit my resume format for ATS compliance.\n\nCheck for:\n1. 🚫 **Parsing Killers** (Tables, Columns, Graphics)\n2. 📑 **Header/Footer Issues**\n3. 📅 **Date Format Consistency**\n4. 🔤 **Font & Layout Best Practices**\n5. 🛠️ **Fixes:** Step-by-step guide to resolve issues.' },
            { title: 'Final Compatibility Score', prompt: 'Provide a Final Compatibility Report.\n\nInclude:\n1. 💯 **Overall Score (0-100)**\n2. 🏆 **Top 3 Strengths**\n3. 🚧 **Top 3 Areas for Improvement**\n4. 🏁 **Verdict:** Apply Now / Minor Tweaks / Major Overhaul\n5. 📝 **Final Checklist** before submitting.' }
        ]
    },
    'Write for Me': {
        name: 'Content Creation Workflow',
        steps: [
            { title: 'Topic Research', prompt: 'Conduct comprehensive research on "[TOPIC]".\n\nDeliver:\n1. 🔥 **Trending Angles** & Hot Takes\n2. 😫 **Audience Pain Points** (Deep dive)\n3. 🕵️ **Competitor Analysis** (What are top ranking articles missing?)\n4. 🔑 **SEO Keyword Cluster** (Primary, Secondary, LSI)\n5. 🔗 **Sources:** List 3 authoritative links/studies to cite.' },
            { title: 'Outline Creation', prompt: 'Create a "Skyscraper" outline for [CONTENT_TYPE] on "[TOPIC]".\n\nStructure:\n1. 🎣 **Hook** (Statistic, Story, or Bold Claim)\n2. 📑 **H2/H3 Hierarchy** (Logical flow)\n3. 💡 **Key Takeaways** per section\n4. 📣 **Call to Action (CTA)** options\n5. 📏 **Estimated Word Count** per section.' },
            { title: 'Write Introduction', prompt: 'Write a magnetic introduction for "[TOPIC]".\n\nMust include:\n1. 🪝 **The Hook** (Grab attention in 3 seconds)\n2. 🥺 **The Problem** (Agitate the pain)\n3. 🚀 **The Solution** (Promise value)\n4. 🌉 **The Transition** (Lead into body)\n5. ✍️ **Tone Check:** Ensure it matches [TONE].' },
            { title: 'Draft Main Content', prompt: 'Draft the core content sections based on the outline.\n\nFocus on:\n1. 💎 **High Value/Density** (No fluff)\n2. 📊 **Data & Examples** (Prove your points)\n3. 📖 **Readability** (Short paragraphs, bullet points)\n4. 🎯 **Audience Alignment:** [AUDIENCE]\n5. 🔗 **Internal/External Linking** opportunities.' },
            { title: 'Polish & Optimize', prompt: 'Polish this content to perfection.\n\nTasks:\n1. ✨ **Readability Booster** (Simplify complex sentences)\n2. 🔍 **SEO Optimization** (Check keyword placement)\n3. 🎨 **Formatting** (Bold key phrases, add blockquotes)\n4. 📣 **CTA Refinement** (Make it irresistible)\n5. 🛠️ **Tools:** Suggest tools for grammar/plagiarism checking.' }
        ]
    },
    'Code Writer': {
        name: 'Code Development Workflow',
        steps: [
            { title: 'Requirements Analysis', prompt: 'Analyze requirements for [TASK] like a Senior Architect.\n\nDeliver:\n1. 🏗️ **Core Functional Requirements**\n2. 🛡️ **Edge Cases & Error Handling**\n3. 💾 **Data Structures & I/O**\n4. ⚡ **Performance Constraints**\n5. 📦 **Tech Stack Recommendations** (Libs/Frameworks).' },
            { title: 'Design Architecture', prompt: 'Design the system architecture.\n\nProvide:\n1. 🗺️ **High-Level Overview**\n2. 🧩 **Component/Class Diagram** (Text description)\n3. 🌊 **Data Flow** (Step-by-step)\n4. 🧪 **Testing Strategy**\n5. 📚 **Resources:** Links to relevant design patterns or docs.' },
            { title: 'Implement Core Logic', prompt: 'Write the production-ready code in [LANGUAGE].\n\nStandards:\n1. 📝 **Clean Code** (Meaningful names, modular)\n2. 🛡️ **Robust Error Handling** (Try/Catch, Validations)\n3. 💬 **Docstrings & Comments**\n4. 🚀 **Optimized Logic**\n5. 💡 **Explanation:** Brief walkthrough of the code.' },
            { title: 'Add Tests', prompt: 'Generate a comprehensive test suite.\n\nInclude:\n1. 🧪 **Unit Tests** (Happy path)\n2. 💥 **Edge Case Tests** (Invalid inputs)\n3. 🔄 **Integration Test Scenarios**\n4. ⚡ **Performance/Load Tests** (if applicable)\n5. 🛠️ **Tools:** Recommend testing frameworks for [LANGUAGE].' },
            { title: 'Documentation & Examples', prompt: 'Create developer-friendly documentation.\n\nInclude:\n1. 📖 **README.md** structure\n2. 🚀 **Quick Start / Installation**\n3. 💡 **Usage Examples** (Code snippets)\n4. ❓ **Troubleshooting / FAQ**\n5. 🔗 **References:** Links to official docs for dependencies.' }
        ]
    },
    'Email Writer': {
        name: 'Professional Email Workflow',
        steps: [
            { title: 'Define Email Strategy', prompt: 'Develop a strategy for this email: [PURPOSE].\n\nAnalyze:\n1. 🎯 **Primary Goal**\n2. 👤 **Recipient Persona** ([RECIPIENT_TYPE])\n3. 🗣️ **Tone & Voice**\n4. 🧠 **Psychological Triggers** to use\n5. 🚧 **Objection Handling** (Pre-empting "No").' },
            { title: 'Draft Subject Lines', prompt: 'Brainstorm 5 high-open-rate subject lines.\n\nTypes:\n1. ❓ **Curiosity Gap**\n2. ⚡ **Urgency/Scarcity**\n3. 🤝 **Personalized/Direct**\n4. 🎁 **Benefit-Driven**\n5. 📊 **Data/Proof**\n\n*Predict the open rate for each.*' },
            { title: 'Write Email Body', prompt: 'Draft the email body for maximum conversion.\n\nStructure:\n1. 👋 **Personalized Greeting**\n2. 🎣 **The "Why You, Why Now"**\n3. 💎 **Value Proposition** (Clear benefits)\n4. 📣 **Clear CTA** (One single ask)\n5. ✍️ **Sign-off**\n\n*Keep it mobile-optimized.*' },
            { title: 'Create Variations', prompt: 'Create 2 A/B test variations.\n\n1. 🅰️ **Variation A:** Short, punchy, direct.\n2. 🅱️ **Variation B:** Story-driven, softer approach.\n\n*Explain the hypothesis for each variation.*' },
            { title: 'Follow-up Sequence', prompt: 'Design a non-annoying follow-up sequence.\n\nPlan:\n1. 🗓️ **Follow-up 1 (Day 3):** "Bump" / Quick thought\n2. 🗓️ **Follow-up 2 (Day 7):** New value add / Resource\n3. 🗓️ **Follow-up 3 (Day 14):** Break-up email\n4. 💡 **Tips:** How to track opens/clicks.' }
        ]
    }
};

export default function WorkflowBuilder({ category }) {
    const { activeChatId, chatsById, sendMessage } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [stepResults, setStepResults] = useState({});
    const [waitingForResponse, setWaitingForResponse] = useState(false);
    const [variables, setVariables] = useState({});
    const [showVariables, setShowVariables] = useState(true);
    const [expandedResults, setExpandedResults] = useState({});

    const chat = activeChatId ? chatsById[activeChatId] : null;
    const workflow = WORKFLOW_TEMPLATES[category];

    useEffect(() => {
        if (waitingForResponse && chat?.messages?.length > 0) {
            const lastMessage = chat.messages[chat.messages.length - 1];

            console.log('Workflow checking message:', {
                role: lastMessage.role,
                currentStep,
                hasContent: !!lastMessage.content,
                contentLength: lastMessage.content?.length
            });

            if (lastMessage.role === 'assistant' && lastMessage.content) {
                console.log('Workflow: Storing result for step', currentStep);
                setStepResults(prev => ({ ...prev, [currentStep]: lastMessage.content }));
                setWaitingForResponse(false);
                setCompletedSteps(prev => [...prev, currentStep]);
                setExpandedResults(prev => ({ ...prev, [currentStep]: true }));
            }
        }
    }, [chat?.messages, waitingForResponse, currentStep]);

    const extractVariables = () => {
        if (!workflow) return [];
        const varSet = new Set();
        workflow.steps.forEach(step => {
            const matches = step.prompt.match(/\[([A-Z_]+)\]/g);
            if (matches) matches.forEach(match => varSet.add(match.slice(1, -1)));
        });
        return Array.from(varSet);
    };

    const executeStep = (stepIndex) => {
        if (!workflow || !activeChatId) return;
        const step = workflow.steps[stepIndex];
        let finalPrompt = step.prompt;
        Object.keys(variables).forEach(varName => {
            const value = variables[varName] || `[${varName}]`;
            finalPrompt = finalPrompt.replace(new RegExp(`\\[${varName}\\]`, 'g'), value);
        });
        let contextPrefix = `[📋 WORKFLOW: ${workflow.name} - Step ${stepIndex + 1}/${workflow.steps.length}]\n`;
        if (stepIndex > 0 && stepResults[stepIndex - 1]) {
            contextPrefix += `\n[Previous step result available for context]\n\n`;
        }
        finalPrompt = contextPrefix + finalPrompt;
        sendMessage(activeChatId, finalPrompt);
        setWaitingForResponse(true);
    };

    const startWorkflow = () => {
        console.log('Starting workflow...');
        setShowVariables(false);
        setCurrentStep(0);
        setCompletedSteps([]);
        setStepResults({});
        setExpandedResults({});
        executeStep(0);
    };

    const continueWorkflow = () => {
        const nextStep = currentStep + 1;
        if (nextStep < workflow.steps.length) {
            setCurrentStep(nextStep);
            executeStep(nextStep);
        } else {
            alert('🎉 Workflow completed! All steps have been executed.');
        }
    };

    if (!workflow) return null;

    const vars = extractVariables();
    const allVarsFilled = vars.every(v => variables[v]?.trim());
    const isWorkflowActive = completedSteps.length > 0 || waitingForResponse;

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all z-40 group hover:scale-110" title={`Start ${workflow.name}`}>
                <Workflow size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isWorkflowActive && setIsOpen(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Workflow className="text-white" size={28} />
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{workflow.name}</h2>
                                            <p className="text-purple-100 text-sm">{workflow.steps.length} steps • Category: {category}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {showVariables && vars.length > 0 && (
                                    <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">Workflow Variables</h4>
                                        <div className="space-y-3">
                                            {vars.map((varName) => (
                                                <div key={varName}>
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{varName.replace(/_/g, ' ')}</label>
                                                    <input type="text" value={variables[varName] || ''} onChange={(e) => setVariables(prev => ({ ...prev, [varName]: e.target.value }))} placeholder={`Enter ${varName.toLowerCase().replace(/_/g, ' ')}`} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {workflow.steps.map((step, index) => {
                                        const isComplete = completedSteps.includes(index);
                                        const isCurrent = currentStep === index && isWorkflowActive;
                                        const isWaiting = isCurrent && waitingForResponse;

                                        return (
                                            <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`border-2 rounded-lg p-4 ${isCurrent ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : isComplete ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {isComplete ? <CheckCircle className="text-green-600" size={20} /> : isWaiting ? <Clock className="text-purple-600 animate-pulse" size={20} /> : isCurrent ? <Circle className="text-purple-600 fill-purple-600" size={20} /> : <Circle className="text-gray-400" size={20} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Step {index + 1}: {step.title}</h5>
                                                        {isWaiting && <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">⏳ Waiting for AI response...</p>}
                                                        {isComplete && stepResults[index] && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">✓ Result:</p>
                                                                    <button onClick={() => setExpandedResults(prev => ({ ...prev, [index]: !prev[index] }))} className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                                                                        {expandedResults[index] ? <><ChevronUp size={14} />Collapse</> : <><ChevronDown size={14} />Expand</>}
                                                                    </button>
                                                                </div>
                                                                <div className={`bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 ${expandedResults[index] ? 'max-h-[500px] overflow-y-auto' : 'max-h-32 overflow-hidden'} transition-all duration-300 custom-scrollbar`}>
                                                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">{stepResults[index]}</pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {isComplete && !isWaiting && index < workflow.steps.length - 1 && index === currentStep && (
                                                            <button onClick={continueWorkflow} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2">
                                                                <ArrowRight size={16} />Continue to Next Step
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {!isWorkflowActive && (
                                    <div className="mt-6">
                                        <button onClick={startWorkflow} disabled={vars.length > 0 && !allVarsFilled} className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Play size={18} />Start Workflow
                                        </button>
                                        {vars.length > 0 && !allVarsFilled && <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 text-center">Please fill in all variables above</p>}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

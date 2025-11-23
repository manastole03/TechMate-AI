import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, CheckCircle, PenTool, Wand2, BookOpen,
    Code, Lightbulb, Layers, Mail, Database,
    ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { useChat } from '../state/chatStore';

const CATEGORY_CONFIGS = {
    'Job Search': {
        icon: Briefcase,
        title: 'Job Search Assistant',
        color: 'from-blue-600 to-cyan-600',
        fields: [
            { name: 'role', label: 'Target Role', type: 'text', placeholder: 'e.g., Senior Software Engineer', required: true },
            { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g., Remote, San Francisco' },
            { name: 'experience', label: 'Experience Level', type: 'select', options: ['Entry Level (0-2 yrs)', 'Mid Level (3-5 yrs)', 'Senior Level (6-10 yrs)', 'Lead/Manager (10+ yrs)'] },
            { name: 'salary', label: 'Target Salary', type: 'text', placeholder: 'e.g., $120k-$150k' }
        ],
        generatePrompt: (data) => `I am searching for a ${data.role} position in ${data.location || 'any location'} with ${data.experience || 'relevant'} experience.

Help me with:
1. Key skills and keywords to highlight in my resume
2. Boolean search strings for LinkedIn/job boards
3. Resume optimization tips for this specific role
4. Top 5 companies hiring for this position
5. Interview preparation questions

${data.salary ? `Target salary range: ${data.salary}` : ''}`
    },

    'Resume Compatibility': {
        icon: CheckCircle,
        title: 'ATS Resume Scanner',
        color: 'from-green-600 to-emerald-600',
        fields: [
            { name: 'jobDescription', label: 'Job Description', type: 'textarea', placeholder: 'Paste the job description here...', required: true },
            { name: 'resumeText', label: 'Your Resume', type: 'textarea', placeholder: 'Paste your resume text here...', required: true },
            { name: 'company', label: 'Company Name', type: 'text', placeholder: 'e.g., Google, Amazon' }
        ],
        generatePrompt: (data) => `Analyze my resume against this job description for ATS compatibility.

**JOB DESCRIPTION:**
${data.jobDescription}

**MY RESUME:**
${data.resumeText}

${data.company ? `**TARGET COMPANY:** ${data.company}` : ''}

Provide:
1. ATS Compatibility Score (0-100)
2. Missing keywords (categorize as CRITICAL/IMPORTANT/NICE-TO-HAVE)
3. Specific bullet point rewrites with quantifiable achievements
4. Section-by-section optimization recommendations
5. Final verdict: APPLY NOW / NEEDS REVISION / NOT A MATCH`
    },

    'Write for Me': {
        icon: PenTool,
        title: 'Content Generator',
        color: 'from-purple-600 to-pink-600',
        fields: [
            { name: 'topic', label: 'Topic', type: 'text', placeholder: 'What should I write about?', required: true },
            { name: 'format', label: 'Format', type: 'select', options: ['Blog Post', 'LinkedIn Post', 'Twitter Thread', 'Email', 'Essay', 'Product Description'] },
            { name: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Casual', 'Persuasive', 'Inspirational', 'Technical'] },
            { name: 'length', label: 'Length', type: 'select', options: ['Short (200-400 words)', 'Medium (400-800 words)', 'Long (800-1500 words)'] }
        ],
        generatePrompt: (data) => `Write ${data.format || 'content'} about: "${data.topic}"

Requirements:
- Tone: ${data.tone || 'Professional'}
- Length: ${data.length || 'Medium'}
- Include a compelling hook in the first 10 seconds
- Use clear structure with headings
- Add actionable insights
- End with a strong CTA

Make it engaging, valuable, and ready to publish.`
    },

    'AI Humanizer': {
        icon: Wand2,
        title: 'Text Humanizer',
        color: 'from-amber-600 to-orange-600',
        fields: [
            { name: 'text', label: 'AI-Generated Text', type: 'textarea', placeholder: 'Paste text to humanize...', required: true },
            { name: 'intensity', label: 'Humanization Level', type: 'select', options: ['Light Polish', 'Moderate Rewrite', 'Deep Humanization', 'Undetectable'] },
            { name: 'preserveLength', label: 'Preserve Length', type: 'checkbox' }
        ],
        generatePrompt: (data) => `Rewrite this text to sound more human and natural:

"${data.text}"

Humanization level: ${data.intensity || 'Moderate Rewrite'}
${data.preserveLength ? 'Maintain similar word count' : 'Length flexible'}

Apply:
- Varied sentence structure (short + long sentences)
- Conversational tone
- Natural imperfections
- Personal touch
- Remove AI-sounding phrases

Provide: [HUMANIZED TEXT], [KEY CHANGES], [AI DETECTION LIKELIHOOD]`
    },

    'Code Writer': {
        icon: Code,
        title: 'Code Generator',
        color: 'from-slate-700 to-gray-900',
        fields: [
            { name: 'language', label: 'Language', type: 'text', placeholder: 'e.g., Python, JavaScript', required: true },
            { name: 'task', label: 'Task Description', type: 'textarea', placeholder: 'Describe what the code should do...', required: true },
            { name: 'quality', label: 'Code Quality', type: 'select', options: ['Quick Script', 'Production-Ready', 'Enterprise-Grade'] },
            { name: 'framework', label: 'Framework (Optional)', type: 'text', placeholder: 'e.g., React, Django' }
        ],
        generatePrompt: (data) => `Write ${data.language} code for: ${data.task}

Quality level: ${data.quality || 'Production-Ready'}
${data.framework ? `Framework: ${data.framework}` : ''}

Provide:
1. Complete, runnable code
2. Inline documentation
3. Error handling
4. Time/space complexity analysis
5. Usage examples
6. Dependencies and setup instructions

Follow ${data.language} best practices and include unit tests for ${data.quality === 'Enterprise-Grade' ? 'comprehensive' : 'core'} functionality.`
    },

    'Email Writer': {
        icon: Mail,
        title: 'Email Composer',
        color: 'from-blue-500 to-indigo-600',
        fields: [
            { name: 'recipient', label: 'Recipient Type', type: 'select', options: ['Hiring Manager', 'Client', 'Colleague', 'Executive', 'Professor'], required: true },
            { name: 'purpose', label: 'Email Purpose', type: 'text', placeholder: 'e.g., Follow-up after interview', required: true },
            { name: 'keyPoints', label: 'Key Points', type: 'textarea', placeholder: 'Main points to include...' },
            { name: 'urgency', label: 'Urgency', type: 'select', options: ['Low', 'Medium', 'High'] }
        ],
        generatePrompt: (data) => `Draft a professional email:

To: ${data.recipient}
Purpose: ${data.purpose}
Urgency: ${data.urgency || 'Medium'}

Key points:
${data.keyPoints || 'N/A'}

Provide:
1. 3 subject line options (with recommendation)
2. Complete email body (mobile-friendly)
3. Clear call-to-action
4. Tone calibration notes
5. Follow-up strategy if no response`
    }
};

export default function CategoryTools({ category, chatId }) {
    const { sendMessage } = useChat();
    const [isExpanded, setIsExpanded] = useState(true);
    const [formData, setFormData] = useState({});

    const config = CATEGORY_CONFIGS[category];

    if (!config) return null;

    const Icon = config.icon;

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = () => {
        const requiredFields = config.fields.filter(f => f.required);
        const hasAllRequired = requiredFields.every(f => formData[f.name]?.trim());

        if (!hasAllRequired) {
            alert('Please fill in all required fields');
            return;
        }

        const prompt = config.generatePrompt(formData);
        sendMessage(chatId, prompt);
        setIsExpanded(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 mx-auto w-full md:max-w-3xl px-2 sm:px-4"
        >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div
                    className={`px-4 py-3 bg-gradient-to-r ${config.color} cursor-pointer flex items-center justify-between`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <Icon className="text-white" size={20} />
                        <span className="font-semibold text-white">{config.title}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="text-white" size={18} /> : <ChevronDown className="text-white" size={18} />}
                </div>

                {/* Form Fields */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 space-y-4">
                                {config.fields.map((field) => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {field.type === 'text' && (
                                            <input
                                                type="text"
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        )}

                                        {field.type === 'textarea' && (
                                            <textarea
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                placeholder={field.placeholder}
                                                rows={4}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            />
                                        )}

                                        {field.type === 'select' && (
                                            <select
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="">Select...</option>
                                                {field.options.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {field.type === 'checkbox' && (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData[field.name] || false}
                                                    onChange={(e) => handleChange(field.name, e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                                            </label>
                                        )}
                                    </div>
                                ))}

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Sparkles size={18} />
                                    Generate
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

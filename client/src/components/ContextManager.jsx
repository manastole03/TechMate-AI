 * Context Manager Component
    * Manages uploaded documents and provides smart suggestions
        */
export default function ContextManager({ chatId }) {
    const { chatsById } = useChat();
    const chat = chatsById[chatId];
    const [isExpanded, setIsExpanded] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [contextAnalysis, setContextAnalysis] = useState(null);

    useEffect(() => {
        analyzeContext();
    }, [documents, chat]);

    const analyzeContext = () => {
        const analysis = {
            hasResume: documents.some(doc => doc.type === 'resume'),
            hasJobDescription: documents.some(doc => doc.type === 'job_description'),
            messageCount: chat?.messages?.length || 0,
            category: chat?.category,
            missing: [],
            suggestions: []
        };

        // Category-specific analysis
        if (chat?.category === 'Job Search' || chat?.category === 'Resume Compatibility') {
            if (!analysis.hasResume) {
                analysis.missing.push({ item: 'Resume', priority: 'high' });
                analysis.suggestions.push('Upload your resume for personalized advice');
            }
            if (!analysis.hasJobDescription) {
                analysis.missing.push({ item: 'Job Description', priority: 'medium' });
                analysis.suggestions.push('Add the job description you\'re targeting');
            }
        }

        // General suggestions based on activity
        if (analysis.messageCount === 0) {
            analysis.suggestions.push('Start by describing your goal or question');
        } else if (analysis.messageCount > 5 && documents.length === 0) {
            analysis.suggestions.push('Consider uploading relevant documents for better context');
        }

        setContextAnalysis(analysis);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);

        for (const file of files) {
            try {
                let content = '';
                let type = 'document';

                // Detect document type
                const fileName = file.name.toLowerCase();
                if (fileName.includes('resume') || fileName.includes('cv')) {
                    type = 'resume';
                } else if (fileName.includes('job') || fileName.includes('jd')) {
                    type = 'job_description';
                }

                // Parse file based on extension
                if (file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                    const parsed = await parseResumeFile(file);
                    content = parsed.text;
                } else if (file.type.startsWith('text/')) {
                    content = await file.text();
                }

                const newDoc = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type,
                    content,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                };

                setDocuments(prev => [...prev, newDoc]);
            } catch (error) {
                console.error('File upload error:', error);
                alert(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        setUploading(false);
        e.target.value = '';
    };

    const removeDocument = (id) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
    };

    const getDocumentIcon = (type) => {
        switch (type) {
            case 'resume':
                return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };
            case 'job_description':
                return { icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
            default:
                return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-700' };
        }
    };

    return (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div
                className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-white/5 cursor-pointer flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Context Manager</span>
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        {documents.length}
                    </span>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-4">
                            {/* Context Analysis */}
                            {contextAnalysis && (
                                <div className="space-y-3">
                                    {/* What's Provided */}
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle size={16} className="text-green-600 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                                                    Current Context
                                                </h4>
                                                <p className="text-xs text-green-800 dark:text-green-200">
                                                    Category: {contextAnalysis.category} • Messages: {contextAnalysis.messageCount} • Documents: {documents.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* What's Missing */}
                                    {contextAnalysis.missing.length > 0 && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                                        Missing Context
                                                    </h4>
                                                    <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
                                                        {contextAnalysis.missing.map((item, i) => (
                                                            <li key={i}>
                                                                <span className={`inline-block w-12 ${item.priority === 'high' ? 'text-red-600 font-bold' : ''}`}>
                                                                    [{item.priority.toUpperCase()}]
                                                                </span>
                                                                {item.item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Smart Suggestions */}
                                    {contextAnalysis.suggestions.length > 0 && (
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <Lightbulb size={16} className="text-indigo-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                                                        Smart Suggestions
                                                    </h4>
                                                    <ul className="text-xs text-indigo-800 dark:text-indigo-200 space-y-0.5">
                                                        {contextAnalysis.suggestions.map((suggestion, i) => (
                                                            <li key={i}>💡 {suggestion}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Upload Area */}
                            <div>
                                <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer group">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.txt,.md"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <Upload size={18} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {uploading ? 'Uploading...' : 'Upload Documents'}
                                    </span>
                                </label>
                            </div>

                            {/* Document List */}
                            {documents.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Uploaded Documents
                                    </h5>
                                    {documents.map((doc) => {
                                        const { icon: Icon, color, bg } = getDocumentIcon(doc.type);
                                        return (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group"
                                            >
                                                <div className={`p-2 rounded ${bg}`}>
                                                    <Icon size={16} className={color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {(doc.size / 1024).toFixed(1)}KB • {doc.type}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {/* Implement preview */ }}
                                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye size={14} className="text-gray-600 dark:text-gray-300" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeDocument(doc.id)}
                                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={14} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

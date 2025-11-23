import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Extract text content from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractPdfText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        const textChunks = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const strings = content.items.map((item) => item.str);
            textChunks.push(strings.join(' '));
        }

        return textChunks.join('\n\n');
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF file');
    }
}

/**
 * Extract text content from a DOC/DOCX file
 * Note: Basic text extraction. For production, consider using mammoth.js
 * @param {File} file - The DOC/DOCX file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractDocText(file) {
    try {
        // Simple text extraction - reads as plain text
        // For .docx (which is XML-based), we'd ideally use a library like mammoth.js
        // For now, attempt to read as text
        const text = await file.text();
        return text;
    } catch (error) {
        console.error('DOC parsing error:', error);
        throw new Error('Failed to parse DOC file');
    }
}

/**
 * Parse resume file (PDF, DOC, DOCX, or TXT)
 * @param {File} file - The resume file to parse
 * @returns {Promise<{text: string, fileName: string, fileType: string}>}
 */
export async function parseResumeFile(file) {
    const fileName = file.name;
    const fileType = file.type || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    let text = '';

    try {
        if (fileType === 'application/pdf' || fileExtension === 'pdf') {
            text = await extractPdfText(file);
        } else if (
            fileType === 'application/msword' ||
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileExtension === 'doc' ||
            fileExtension === 'docx'
        ) {
            text = await extractDocText(file);
        } else if (
            fileType.startsWith('text/') ||
            fileExtension === 'txt' ||
            fileExtension === 'md'
        ) {
            text = await file.text();
        } else {
            throw new Error('Unsupported file format. Please upload PDF, DOC, DOCX, or TXT files.');
        }

        return {
            text: text.trim(),
            fileName,
            fileType: fileExtension || 'unknown'
        };
    } catch (error) {
        console.error('Resume parsing error:', error);
        throw error;
    }
}

/**
 * Clean and format resume text for better analysis
 * @param {string} text - Raw resume text
 * @returns {string} - Cleaned and formatted text
 */
export function cleanResumeText(text) {
    return text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
        .trim();
}

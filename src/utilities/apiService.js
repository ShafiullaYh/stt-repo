const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const BACKEND_TOKEN = import.meta.env.VITE_BACKEND_TOKEN;

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (BACKEND_TOKEN) {
        headers['Authorization'] = `Bearer ${BACKEND_TOKEN}`;
    }

    return headers;
};

export const summarizeWithOpenAI = async (text) => {
    try {
        const response = await fetch(`${API_BASE_URL}/summarize-with-openai`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'OpenAI summarization failed');
        }

        return data.summary || data.data?.summary || 'No summary generated';
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
};

export const summarizeWithGroq = async (text) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groq-ai-llm`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ data: text }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Groq summarization failed');
        }

        return data.summary || data.data?.summary || 'No summary generated';
    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
};

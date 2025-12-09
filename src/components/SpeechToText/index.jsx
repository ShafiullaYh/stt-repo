import { useState } from "react";
import { Row, Col, message } from "antd";
import SpeechSection from "./SpeechSection";
import { summarizeWithOpenAI, summarizeWithGroq } from "../../utilities/apiService";
import "../../styles/SpeechScreen.scss";

const SpeechScreen = () => {
    const [sectionsData, setSectionsData] = useState({
        patient_history: { text: "", openaiSummary: "", grokSummary: "", loading: false },
        family_history: { text: "", openaiSummary: "", grokSummary: "", loading: false },
        hospital_course: { text: "", openaiSummary: "", grokSummary: "", loading: false }
    });

    const handleProcess = async (text, section) => {
        if (!text.trim()) {
            message.warning('Please provide some text to process');
            return;
        }

        setSectionsData(prev => ({
            ...prev,
            [section]: { ...prev[section], loading: true }
        }));

        try {
            // Call both APIs in parallel
            const [openaiSummary, grokSummary] = await Promise.all([
                summarizeWithOpenAI(text).catch(err => {
                    console.error('OpenAI failed:', err);
                    return '<p style="color: #ef4444;">OpenAI summarization failed. Please try again.</p>';
                }),
                summarizeWithGroq(text).catch(err => {
                    console.error('Groq failed:', err);
                    return '<p style="color: #ef4444;">Groq summarization failed. Please try again.</p>';
                })
            ]);

            setSectionsData(prev => ({
                ...prev,
                [section]: {
                    text,
                    openaiSummary,
                    grokSummary,
                    loading: false
                }
            }));

            message.success('AI summaries generated successfully!');
        } catch (error) {
            console.error(`Error processing ${section}:`, error);
            message.error('Failed to generate summaries');

            setSectionsData(prev => ({
                ...prev,
                [section]: { ...prev[section], loading: false }
            }));
        }
    };

    return (
        <div className="patient-labels-container">
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <h1 className="action-title">Discharge Summary Generator</h1>
                    <p className="subtitle">Real-time medical transcription with discharge summaries</p>
                </Col>
            </Row>

            <SpeechSection
                title="Patient History"
                processedTitle="Summary Report"
                sectionKey="patient_history"
                onProcess={handleProcess}
                sectionData={sectionsData.patient_history}
            />

            <SpeechSection
                title="Family History"
                processedTitle="Summary Report"
                sectionKey="family_history"
                onProcess={handleProcess}
                sectionData={sectionsData.family_history}
            />

            <SpeechSection
                title="Hospital Course"
                processedTitle="Summary Report"
                sectionKey="hospital_course"
                onProcess={handleProcess}
                sectionData={sectionsData.hospital_course}
            />
        </div>
    );
};

export default SpeechScreen;

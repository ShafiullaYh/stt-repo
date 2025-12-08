import { useState } from "react";
import { Row, Col, Button } from "antd";
import SpeechSection from "./SpeechSection";
import "./SpeechScreen.scss";

const SpeechScreen = () => {
    const [sectionsData, setSectionsData] = useState({
        patient_history: { text: "", openaiSummary: "", grokSummary: "", loading: false },
        family_history: { text: "", openaiSummary: "", grokSummary: "", loading: false },
        hospital_course: { text: "", openaiSummary: "", grokSummary: "", loading: false }
    });

    const handleProcess = async (text, section) => {
        if (!text.trim()) return;

        setSectionsData(prev => ({
            ...prev,
            [section]: { ...prev[section], loading: true }
        }));

        try {
            const [openaiSummary, grokSummary] = await Promise.all([
                new Promise(resolve => setTimeout(() =>
                    resolve(`${text.substring(0, 100)}... (OpenAI Medical Summary)`), 1500
                )),
                new Promise(resolve => setTimeout(() =>
                    resolve(`${text.substring(0, 100)}... (Grok Clinical Analysis)`), 1500
                ))
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
        } catch (error) {
            console.error(`Error processing ${section}:`, error);
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
                    <p className="subtitle"></p>
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

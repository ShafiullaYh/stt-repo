import { useState } from "react";
import { Button } from "antd";
import SpeechSection from "./SpeechSection";
import { speechSections } from "../utilities/constant";

const SpeechScreen = () => {
    const [clearTrigger, setClearTrigger] = useState(0);

    const handleProcess = async (text, type) => {
        console.log("Processing:", type, text);
    };

    const clearAllSections = () => {
        setClearTrigger(prev => prev + 1);
    };

    return (
        <div className="patient-labels-container">
            <div className="screen-header">
                <span className="action-title">Discharge Summary Generator - Proof of Concepts</span>

                <Button
                    danger
                    onClick={clearAllSections}
                    className="clear-all-btn"
                >
                    Clear All Sections
                </Button>
            </div>

            {speechSections.map(({ title, type }) => (
                <SpeechSection
                    key={type}
                    title={title}
                    processedTitle={`${title} - Processed`}
                    sectionType={type}
                    clearSignal={clearTrigger}
                    onProcess={(text) => handleProcess(text, type)}
                />
            ))}
        </div>
    );
};

export default SpeechScreen;

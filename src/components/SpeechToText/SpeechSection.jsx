import { useEffect, useState } from "react";
import { Card, Button, Row, Col, Input, Select, Spin } from "antd";
import { AudioOutlined, AudioMutedOutlined } from "@ant-design/icons";
import useSpeechToText from "./useSpeechToText";
import useSpeechmaticsRealtime from "./useSpeechmaticsRealtime";
import useDeepgramRealtime from "./useDeepgramRealtime";
import "./speech-section.scss";

const { TextArea } = Input;

export default function SpeechSection({
    title,
    processedTitle,
    sectionKey,
    onProcess,
    sectionData
}) {
    const [localProvider, setLocalProvider] = useState("webspeechapi");

    const webSpeechHook = useSpeechToText();
    const speechmaticsHook = useSpeechmaticsRealtime();
    const deepgramHook = useDeepgramRealtime();

    let activeHook;
    let providerLabel;

    switch (localProvider) {
        case "speechmatics":
            activeHook = speechmaticsHook;
            providerLabel = "Speechmatics Medical";
            break;
        case "deepgram":
            activeHook = deepgramHook;
            providerLabel = "Deepgram Nova-3 Medical";
            break;
        default:
            activeHook = webSpeechHook;
            providerLabel = "Browser Speech API";
    }

    const {
        transcript,
        setTranscript,
        listening,
        startListening,
        stopListening,
    } = activeHook;

    const handleToggle = () => {
        if (listening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleProcess = () => {
        onProcess(transcript, sectionKey);
    };

    useEffect(() => {
        setTranscript("");
        if (listening) stopListening();
    }, [localProvider]);

    return (
        <Card className="speech-section-card">
            <Row gutter={[24, 24]}>
                {/* LEFT: STT Controls */}
                <Col xs={24} lg={8}>
                    <div className="stt-panel">
                        <div className="section-header">
                            <div className="section-title">{title}</div>
                            <Select
                                value={localProvider}
                                size="middle"
                                style={{ width: 200, minWidth: 160 }}
                                onChange={setLocalProvider}
                            >
                                <Select.Option value="webspeechapi">Browser Speech API</Select.Option>
                                <Select.Option value="speechmatics">Speechmatics Medical</Select.Option>
                                <Select.Option value="deepgram">Deepgram Nova-3 Medical</Select.Option>
                            </Select>
                        </div>

                        <Button
                            type={listening ? "primary" : "default"}
                            icon={listening ? <AudioMutedOutlined /> : <AudioOutlined />}
                            onClick={handleToggle}
                            block
                            size="large"
                            className="record-btn"
                        >
                            {listening ? "Stop Recording" : "Start Recording"}
                        </Button>

                        {listening && (
                            <div className="recording-status">
                                Listening with {providerLabel}...
                            </div>
                        )}

                        <TextArea
                            rows={6}
                            value={transcript}
                            onChange={(e) => !listening && setTranscript(e.target.value)}
                            disabled={listening}
                            className="speech-textarea"
                            placeholder="Click Record to start transcription..."
                        />

                        <Button
                            type="primary"
                            onClick={handleProcess}
                            disabled={!transcript?.trim() || sectionData?.loading}
                            loading={sectionData?.loading}
                            block
                            size="large"
                            className="process-btn"
                        >
                            Process
                        </Button>

                        <div className="provider-info">{providerLabel}</div>
                    </div>
                </Col>

                <Col xs={24} lg={16}>
                    <div className="summary-panel">
                        <div className="section-header">
                            <div className="section-title">{processedTitle}</div>
                        </div>

                        {sectionData?.loading ? (
                            <div className="loading-container">
                                <Spin size="default" />
                                <div>Generating Summary...</div>
                            </div>
                        ) : sectionData?.openaiSummary || sectionData?.grokSummary ? (
                            <div className="dual-summary">
                                <div className="summary-card openai">
                                    <div className="summary-header">OpenAI GPT-4o</div>
                                    <div className="summary-content">{sectionData.openaiSummary}</div>
                                </div>
                                <div className="summary-card grok">
                                    <div className="summary-header">Grok (xAI)</div>
                                    <div className="summary-content">{sectionData.grokSummary}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-data">
                                Record speech and click "Process" to see results from both models
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </Card>
    );
}

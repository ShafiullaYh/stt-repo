import { useEffect, useState, useRef } from "react";
import {
    Card,
    Button,
    Row,
    Col,
    Input,
    message,
    Spin,
    Modal,
    Select
} from "antd";
import {
    AudioOutlined,
    AudioMutedOutlined
} from "@ant-design/icons";
import useSpeechToText from "../hooks/useSpeechToText";
import useSpeechmaticsRealtime from "../hooks/useSpeechmaticsRealtime";
import useDeepgramRealtime from "../hooks/useDeepgramRealtime";
import useElevenLabsScribe from "../hooks/useElevenLabsScribe";
import useAssemblyAI from "../hooks/useAssemblyAi";
import { STT_PROVIDERS } from "../utilities/constant";
import { OpenAIPrompts, GroqAIPrompts } from "../utilities/promptConfig";
import { CopyOutlined } from "@ant-design/icons";
import "../styles/speech-section.scss";
import { AppActions } from "../utilities/actions";

const { TextArea } = Input;
const { Option } = Select;

export default function SpeechSection({
    title,
    processedTitle,
    sectionType,
    onProcess,
    onConfirm,
    onDownload,
    clearSignal
}) {
    // STT Provider state - each section manages its own
    const [sttProvider, setSttProvider] = useState("deepgram");

    // Initialize all STT hooks
    const webSpeechHook = useSpeechToText();
    const speechmaticsHook = useSpeechmaticsRealtime();
    const deepgramHook = useDeepgramRealtime();
    const elevenlabs = useElevenLabsScribe();
    const assemblyai = useAssemblyAI();

    // Processing states
    const [processedData, setProcessedData] = useState("");
    const [loading, setLoading] = useState(false);

    // LLM and Prompt states
    const [llmProvider, setLlmProvider] = useState("openai");
    const [tempPrompt, setTempPrompt] = useState("");
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptType, setPromptType] = useState("custom"); // 'default' or 'custom'
    const [hasSavedCustomPrompt, setHasSavedCustomPrompt] = useState(false);
    const [useCustomPromptOnce, setUseCustomPromptOnce] = useState(false);
    const transcriptRef = useRef(null);
    const [textareaHeight, setTextareaHeight] = useState(0);
    const processedRef = useRef(null);
    const bannerRef = useRef(null);
    const [bannerHeight, setBannerHeight] = useState(0);
    const getLocalStorageKey = () => {
        return `custom_prompt_${sectionType}_${llmProvider}`;
    };

    // Load custom prompt from localStorage
    const loadCustomPromptFromStorage = () => {
        try {
            const stored = localStorage.getItem(getLocalStorageKey());
            return stored || "";
        } catch (error) {
            console.error("Error loading from localStorage:", error);
            return "";
        }
    };

    // Save custom prompt to localStorage
    const saveCustomPromptToStorage = (prompt) => {
        try {
            localStorage.setItem(getLocalStorageKey(), prompt);
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    };

    // Get default prompt based on sectionType and llmProvider
    const getDefaultPrompt = () => {
        const promptMap = llmProvider === "groq" ? GroqAIPrompts : OpenAIPrompts;
        return promptMap[sectionType] || "";
    };

    // ============================================
    // STT PROVIDER SELECTION
    // ============================================

    let activeHook;
    let providerLabel;
    let placeholderText;

    switch (sttProvider) {
        case "speechmatics":
            activeHook = speechmaticsHook;
            providerLabel = "Speechmatics (Medical)";
            placeholderText = "Speechmatics Medical Transcription";
            break;
        case "deepgram":
            activeHook = deepgramHook;
            providerLabel = "Deepgram Nova-3 Medical";
            placeholderText = "Deepgram Medical Transcription";
            break;
        case "elevenlabs":
            activeHook = elevenlabs;
            providerLabel = "ElevenLabs Scribe";
            placeholderText = "ElevenLabs Scribe";
            break;
        case "assemblyai":
            activeHook = assemblyai;
            providerLabel = "Assembly AI";
            placeholderText = "Assembly AI";
            break;
        default:
            activeHook = deepgramHook;
            providerLabel = "Deepgram Nova-3 Medical";
            placeholderText = "Deepgram Medical Transcription";
    }

    const {
        transcript,
        setTranscript,
        listening,
        startListening,
        stopListening
    } = activeHook;

    // ============================================
    // RECORDING CONTROLS
    // ============================================

    const handleToggle = () => {
        if (listening) stopListening();
        else startListening();
    };

    // Clear on signal or provider change
    useEffect(() => {
        stopListening();
        setTranscript("");
        setProcessedData("");
    }, [clearSignal, sttProvider]);

    const handleOpenPromptModal = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => {
            setPromptType("default");
            setTempPrompt(getDefaultPrompt());
            setIsPromptModalOpen(true);
        }, 100);
    };

    const handleCancelPromptModal = () => {
        setIsPromptModalOpen(false);
        setTempPrompt("");
        setPromptType("custom");
    };

    const handleSavePrompt = () => {
        if (promptType === "custom" && tempPrompt.trim()) {
            saveCustomPromptToStorage(tempPrompt);
            setHasSavedCustomPrompt(true);

            // Enable custom prompt for NEXT ONE request only
            setUseCustomPromptOnce(true);

            message.success("Custom prompt saved successfully!");
        }
        setIsPromptModalOpen(false);
    };

    // Handle prompt type change in modal
    const handlePromptTypeChange = (type) => {
        setPromptType(type);

        if (type === "default") {
            setTempPrompt(getDefaultPrompt());
        } else {
            // CUSTOM MODE
            const saved = loadCustomPromptFromStorage();

            if (saved && saved.trim() !== "") {
                // User already has a saved custom prompt
                setTempPrompt(saved);
            } else {
                setTempPrompt(getDefaultPrompt());
            }
        }
    };


    const callGroqApi = async (text, promptToUse) => {
        setProcessedData("");
        setLoading(true);

        const payload = { text, prompt: promptToUse };

        return AppActions.makeApiCall(
            "post",
            "speechToText/groq-ai-llm",
            payload,
            { requiresAuth: true }
        )
            .then((res) => {
                if (res?.data?.success) {
                    const summary = res.data.summary;
                    setProcessedData(summary);
                    onProcess && onProcess(res.data);
                } else {
                    message.error("Groq request failed");
                    setProcessedData("");
                }
            })
            .catch((err) => {
                console.error("Error calling GROQ API:", err);
                message.error("Groq API error");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const callOpenApi = async (text, promptToUse) => {
        setProcessedData("");
        setLoading(true);

        const payload = { text, prompt: promptToUse };

        return AppActions.makeApiCall(
            "post",
            "speechToText/summarize-with-openai",
            payload,
            { requiresAuth: true }
        )
            .then((res) => {
                if (res?.data?.success) {
                    const summary = res.data.summary;
                    setProcessedData(summary);
                    onProcess && onProcess(summary);
                    return summary;
                } else {
                    message.error("OpenAI request failed");
                    setProcessedData("");
                    return;
                }
            })
            .catch((err) => {
                console.error("Error calling OpenAI API:", err);
                message.error("OpenAI API error");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleProcess = () => {
        if (!transcript) {
            message.warning("Please record or enter some text first");
            return;
        }

        let promptToUse;

        if (useCustomPromptOnce) {
            // Use custom prompt ONLY for this request
            const customPrompt = loadCustomPromptFromStorage();
            promptToUse = customPrompt.trim() ? customPrompt : getDefaultPrompt();

            // After using once, disable it
            setUseCustomPromptOnce(false);
        } else {
            // Always fallback to default
            promptToUse = getDefaultPrompt();
        }

        // Call API
        if (llmProvider === "groq") {
            callGroqApi(transcript, promptToUse);
        } else {
            callOpenApi(transcript, promptToUse);
        }
    };
    useEffect(() => {
        if (!transcriptRef.current) return;
        const textAreaDom =
            transcriptRef.current?.resizableTextArea?.textArea;

        if (!textAreaDom) return;

        // Create observer
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const newHeight = entry.contentRect.height;
                setTextareaHeight(newHeight);
                console.log("Textarea height changed:", newHeight);
            }
        });

        observer.observe(textAreaDom);

        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!processedRef.current) return;

        const processedDom =
            processedRef.current?.resizableTextArea?.textArea;

        if (processedDom) {
            processedDom.style.height = (textareaHeight + 10) + "px";
            processedDom.style.minHeight = textareaHeight + "px";
        }
    }, [textareaHeight]);

    useEffect(() => {
        if (bannerRef.current) {
            setBannerHeight(bannerRef.current.clientHeight);
        } else {
            setBannerHeight(0);
        }
    }, [listening]);

    useEffect(() => {
        const dom = transcriptRef.current?.resizableTextArea?.textArea;
        if (!dom) return;

        const isNearBottom =
            dom.scrollHeight - dom.scrollTop - dom.clientHeight < 40;

        if (isNearBottom) {
            dom.scrollTop = dom.scrollHeight;
        }
    }, [transcript]);


    return (
        <>
            <Spin spinning={loading} tip="Processing..." className="custom-spin">
                <Card className="speech-section-card">
                    <Row gutter={[16, 16]} align="top">
                        {/* LEFT COLUMN: RECORD + TRANSCRIPT */}
                        <Col xs={24} sm={24} md={12} lg={12} className="speech-column">
                            <div className="column-content">
                                <div className="section-header">
                                    <span className="section-title">{title}</span>

                                    <div className="section-header-actions">
                                        <Select
                                            value={sttProvider}
                                            onChange={setSttProvider}
                                            size="middle"
                                            className="stt-select"
                                            disabled={loading || listening}
                                            options={STT_PROVIDERS}
                                            placeholder="STT Provider"
                                        />

                                        <Button
                                            className="record-btn"
                                            type={listening ? "primary" : "default"}
                                            icon={listening ? <AudioMutedOutlined /> : <AudioOutlined />}
                                            onClick={() => {
                                                // Use explicit start/stop from activeHook
                                                if (listening) activeHook.stopListening();
                                                else activeHook.startListening();
                                            }}
                                            disabled={loading}
                                            size="middle"
                                        >
                                            {listening ? "Stop" : "Record"}
                                        </Button>

                                        {/* PAUSE / RESUME */}
                                        {listening && (
                                            <Button
                                                className="pause-btn"
                                                onClick={() => {
                                                    if (activeHook?.paused) {
                                                        activeHook.resumeListening && activeHook.resumeListening();
                                                    } else {
                                                        activeHook.pauseListening && activeHook.pauseListening();
                                                    }
                                                }}
                                                disabled={loading}
                                                size="middle"
                                            >
                                                {activeHook?.paused ? "Resume" : "Pause"}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {listening && (
                                    <div ref={bannerRef} className="recording-banner">
                                        <span className={activeHook?.paused ? "paused-dot" : "pulse-dot"} />

                                        {activeHook?.paused
                                            ? "Recording Paused"
                                            : `Recording with ${providerLabel}...`}
                                    </div>
                                )}


                                <TextArea
                                    ref={transcriptRef}
                                    rows={8}
                                    id={placeholderText}
                                    value={transcript}
                                    onChange={(e) => !listening && setTranscript(e.target.value)}
                                    disabled={listening || loading}
                                    className="speech-textarea"
                                    placeholder={placeholderText}
                                />

                                <div className="below-textarea-actions">
                                    <Button
                                        type="link"
                                        onClick={handleOpenPromptModal}
                                        disabled={loading}
                                        className="prompt-link-btn"
                                    >
                                        View / Edit Prompt
                                    </Button>

                                    <div className="action-buttons-group">
                                        <Select
                                            value={llmProvider}
                                            onChange={setLlmProvider}
                                            size="middle"
                                            className="llm-select"
                                            disabled={loading}
                                        >
                                            <Option value="groq">Groq</Option>
                                            <Option value="openai">OpenAI</Option>
                                        </Select>

                                        <Button
                                            type="primary"
                                            className="process-btn"
                                            onClick={handleProcess}
                                            disabled={!transcript || loading}
                                            loading={loading}
                                            size="middle"
                                        >
                                            Process
                                        </Button>

                                        <Button
                                            danger
                                            onClick={() => {
                                                setTranscript("");
                                                setProcessedData("");
                                            }}
                                            disabled={loading}
                                            size="middle"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Col>

                        {/* RIGHT COLUMN: PROCESSED OUTPUT */}
                        <Col xs={24} sm={24} md={12} lg={12} className="speech-column" >
                            <div className="column-content"  >
                                <div className="section-header">
                                    <span className="section-title">{processedTitle}</span>
                                </div>

                                <TextArea
                                    ref={processedRef}
                                    rows={8}
                                    value={processedData}
                                    onChange={(e) => setProcessedData(e.target.value)}
                                    className="speech-textarea processed-textarea"
                                    placeholder="Processed output will appear here..."
                                    style={{ marginTop: listening ? bannerHeight + 8 : 0 }}
                                />

                                <div className="processed-actions">
                                    <Button
                                        type="primary"
                                        onClick={() => onConfirm && onConfirm(processedData)}
                                        disabled={!processedData || loading}
                                        size="middle"
                                    >
                                        Confirm
                                    </Button>

                                    {/* <Button
                                        onClick={() => onDownload && onDownload(processedData)}
                                        disabled={!processedData || loading}
                                        size="middle"
                                    >
                                        Download
                                    </Button> */}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>
            </Spin>

            {/* PROMPT MODAL */}
            <Modal
                title={
                    <div className="modal-title-wrapper">
                        <span>Edit Prompt - {title}</span>
                        <Select
                            value={promptType}
                            onChange={handlePromptTypeChange}
                            size="small"
                            className="prompt-type-selector"
                            disabled={loading}
                        >
                            <Option value="default">Default Prompt</Option>
                            <Option value="custom">Custom Prompt</Option>
                        </Select>
                    </div>
                }
                open={isPromptModalOpen}
                onOk={handleSavePrompt}
                onCancel={handleCancelPromptModal}
                okText={promptType === "custom" ? "Save Custom Prompt" : "Close"}
                cancelText="Cancel"
                centered
                width="90%"
                // style={{
                //     maxWidth: 700,
                //     top: 20
                // }}
                bodyStyle={{
                    maxHeight: 'calc(100vh - 100px)',
                    overflowY: 'auto'
                }}
                maskClosable={!loading}
                okButtonProps={{
                    disabled: loading || (promptType === "custom" && !tempPrompt.trim())
                }}
                cancelButtonProps={{ disabled: loading }}
                className="prompt-modal"
                destroyOnClose={true}
                getContainer={false}
            >
                <div className="prompt-info-banner">
                    {promptType === "default" ? (
                        <span>📋 Viewing the default prompt (read-only)</span>
                    ) : (
                        <span>✏️ Edit and save your custom prompt for this section</span>
                    )}
                </div>

                <div style={{ position: "relative" }}>
                    {promptType === "default" && (
                        <Button
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => {
                                navigator.clipboard.writeText(tempPrompt);
                                message.success("Prompt copied!");
                            }}
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 16,
                                zIndex: 10,
                                fontSize: 16
                            }}
                        />
                    )}

                    <TextArea
                        rows={12}
                        value={tempPrompt}
                        onChange={(e) => promptType === "custom" && setTempPrompt(e.target.value)}
                        disabled={loading || promptType === "default"}
                        placeholder={
                            promptType === "custom"
                                ? "Enter your custom prompt instructions..."
                                : "Default prompt (read-only)"
                        }
                        className="prompt-textarea"
                        autoFocus={promptType === "custom"}
                        style={{
                            paddingTop: 32, // ensures copy icon does NOT overlap text
                        }}
                    />
                </div>
                {promptType === "custom" && <div
                    style={{
                        marginTop: 16,
                        padding: "12px 14px",
                        background: "#FFFBE6",
                        border: "1px solid #FFE58F",
                        borderRadius: 6,
                        fontSize: 13,
                        color: "#8B7500",
                        whiteSpace: "pre-line",
                    }}
                >
                    ⚠️ <b>Do NOT remove the following mandatory lines in the prompt:</b>

                    {"\n\n"}
                    INPUT:
                    {"\n"}&lt;&lt;TRANSCRIPT&gt;&gt;
                    {"\n"}{"{{transcript}}"}
                    {"\n"}&lt;&lt;END&gt;&gt;
                </div>}

            </Modal>
        </>
    );
}

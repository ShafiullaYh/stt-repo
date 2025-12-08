import { useEffect, useRef, useState } from "react";

const SPEECHMATICS_API_KEY = import.meta.env.VITE_SPEECHMATICS_API_KEY;
const SPEECHMATICS_WS_URL = import.meta.env.VITE_SPEECHMATICS_WS_URL;


export default function useSpeechToText() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    const wsRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);

    const getTemporaryToken = async () => {
        try {
            const response = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ttl: 3600
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to get token: ${response.status}`);
            }

            const data = await response.json();
            console.log("Got temporary token");
            return data.key_value;
        } catch (error) {
            console.error("Token generation failed:", error);
            throw error;
        }
    };

    const startListening = async () => {
        try {
            console.log("Getting temporary token...");
            const tempToken = await getTemporaryToken();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            mediaStreamRef.current = stream;

            const ws = new WebSocket(`${SPEECHMATICS_WS_URL}?jwt=${tempToken}`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Speechmatics connected");

                ws.send(JSON.stringify({
                    message: "StartRecognition",
                    audio_format: {
                        type: "raw",
                        encoding: "pcm_s16le",
                        sample_rate: 16000
                    },
                    transcription_config: {
                        language: "en",
                        domain: "medical",
                        enable_partials: true,
                        max_delay: 2.0,
                        operating_point: "enhanced",
                        diarization: "speaker",

                        // Clean output
                        transcript_filtering_config: {
                            remove_disfluencies: true
                        },

                        punctuation_overrides: {
                            permitted_marks: [".", ",", "?", "!"],
                            sensitivity: 0.6
                        }
                    }
                }));

                setupAudioProcessing(stream, ws);
                setListening(true);
                setTranscript("");
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.message === "RecognitionStarted") {
                    console.log("🎙️ Recognition started");
                }

                // Handle FINAL transcripts
                if (data.message === "AddTranscript") {
                    if (data.results && data.results.length > 0) {
                        const words = data.results
                            .map(r => {
                                if (r.type === "word") {
                                    return r.alternatives?.[0]?.content || "";
                                } else if (r.type === "punctuation") {
                                    return r.alternatives?.[0]?.content || "";
                                }
                                return "";
                            })
                            .filter(w => w.length > 0);

                        if (words.length > 0) {
                            const newText = words.join(" ").replace(/\s+([.,!?])/g, "$1");

                            console.log("Adding:", newText);

                            setTranscript(prev => {
                                // Smart concatenation - add space only if needed
                                if (!prev) return newText;

                                // If previous ends with punctuation, capitalize next word
                                if (prev.match(/[.!?]\s*$/)) {
                                    return prev + " " + newText;
                                }

                                // If new text is punctuation, don't add space
                                if (newText.match(/^[.,!?]/)) {
                                    return prev + newText;
                                }

                                return prev + " " + newText;
                            });
                        }
                    }
                }

                if (data.message === "AddPartialTranscript") {
                    if (data.metadata?.transcript) {
                        console.log("Partial:", data.metadata.transcript);
                    }
                }

                if (data.message === "EndOfTranscript") {
                    console.log("Transcription completed");
                }

                if (data.message === "Warning") {
                    console.warn("Warning : ", data.type, ":", data.reason);
                }

                if (data.message === "Error") {
                    console.error("Error : ", data.type, ":", data.reason);
                    alert(`Speechmatics Error: ${data.reason}`);
                    stopListening();
                }

                if (data.message === "Info") {
                    console.log("Info : ", data.reason);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                stopListening();
            };

            ws.onclose = (event) => {
                console.log("Closed:", event.code);
                setListening(false);
            };

        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "Failed to start");
        }
    };

    const setupAudioProcessing = (stream, ws) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);

                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                ws.send(pcmData.buffer);
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
    };

    const stopListening = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                message: "EndOfStream",
                last_seq_no: Date.now()
            }));

            setTimeout(() => wsRef.current?.close(), 1000);
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        setListening(false);
    };

    useEffect(() => {
        return () => {
            if (listening) stopListening();
        };
    }, []);

    return {
        transcript,
        setTranscript,
        listening,
        startListening,
        stopListening
    };
}
import { useEffect, useRef, useState } from "react";

const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const DEEPGRAM_WS_URL = import.meta.env.VITE_DEEPGRAM_WS_URL;

export default function useDeepgramRealtime() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    const wsRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);

    const startListening = async () => {
        try {
            console.log("Starting Deepgram...");

            // microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            const params = new URLSearchParams({
                model: 'nova-3-medical',
                punctuate: 'true',
                smart_format: 'true',
                interim_results: 'true',
                language: 'en',
                encoding: 'linear16',
                sample_rate: '16000',
                channels: '1',
                endpointing: '300',
                utterance_end_ms: '1000',
                numbers: 'true',
                medical_dictation: 'true',
                vad_events: 'true',
                diarize: 'true',
                filler_words: 'false'  // false : Remove um, uh...
            });

            const wsUrl = `${DEEPGRAM_WS_URL}?${params.toString()}`;

            const ws = new WebSocket(wsUrl, ['token', DEEPGRAM_API_KEY]);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Deepgram connected");

                setupAudioProcessing(stream, ws);
                setListening(true);
                setTranscript("");
            };

            ws.onmessage = (message) => {
                try {
                    const data = JSON.parse(message.data);

                    if (data.type === 'Results') {
                        const result = data.channel?.alternatives?.[0];

                        if (result && result.transcript) {
                            const newText = result.transcript.trim();

                            if (newText.length > 0) {
                                if (data.is_final) {
                                    console.log("Final:", newText);

                                    setTranscript(prev => {
                                        if (!prev) return newText;

                                        if (prev.match(/[.!?]\s*$/)) {
                                            return prev + " " + newText;
                                        }

                                        if (newText.match(/^[.,!?]/)) {
                                            return prev + newText;
                                        }

                                        return prev + " " + newText;
                                    });
                                } else {
                                    console.log("Interim:", newText);
                                }
                            }
                        }
                    }

                    if (data.type === 'Metadata') {
                        console.log("Deepgram ready - Model:", data.model_info);
                    }

                    if (data.type === 'SpeechStarted') {
                        console.log("Speech detected");
                    }

                    if (data.type === 'UtteranceEnd') {
                        console.log("Utterance ended");
                    }
                } catch (error) {
                    console.error("Error parsing message:", error);
                }
            };

            ws.onerror = (error) => {
                console.error("Deepgram error:", error);
                alert("Deepgram connection error. Check API key.");
                stopListening();
            };

            ws.onclose = (event) => {
                console.log("Deepgram closed:", event.code, event.reason);
                setListening(false);

                if (event.code === 1008) {
                    alert("Authentication failed. Check Deepgram API key.");
                }
            };

        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "Failed to start Deepgram");
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

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(new ArrayBuffer(0));

            setTimeout(() => {
                wsRef.current?.close();
            }, 500);
        }

        // Stop microphone
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
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
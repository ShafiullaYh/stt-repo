import { useEffect, useRef, useState } from "react";

const getWebSocketURL = () => {
    const apiUrl = import.meta.env.VITE_API_URL
        || "http://localhost:5000";
    const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
    const host = apiUrl.replace(/^https?:\/\//, "");
    return `${wsProtocol}://${host}/ws?service=deepgram`;
};

const DEEPGRAM_WS_URL = getWebSocketURL();
console.log("Deepgram WebSocket URL:", DEEPGRAM_WS_URL);

export default function useDeepgramRealtime() {
    const [listening, setListening] = useState(false);
    const [paused, setPaused] = useState(false);
    const pausedRef = useRef(false);

    const [transcript, setTranscript] = useState("");
    const [partialTranscript, setPartialTranscript] = useState("");

    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);

    const accumulatedRef = useRef("");


    const startListening = async () => {
        try {
            console.log("Connecting:", DEEPGRAM_WS_URL);

            const ws = new WebSocket(DEEPGRAM_WS_URL);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log("WS connected → requesting Deepgram session");
                ws.send(JSON.stringify({ event: "start" }));

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                streamRef.current = stream;
                setupAudioProcessing(stream, ws);

                accumulatedRef.current = "";
                setTranscript("");
                setPartialTranscript("");

                pausedRef.current = false;
                setPaused(false);

                setListening(true);
            };

            ws.onerror = (err) => {
                console.error("WebSocket Error:", err);
                alert("WebSocket connection error. Check console.");
            };

            ws.onclose = () => {
                console.log("WS closed");
                setListening(false);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.transcript && data.is_final) {
                        accumulatedRef.current = accumulatedRef.current
                            ? accumulatedRef.current + " " + data.transcript
                            : data.transcript;

                        setTranscript(accumulatedRef.current.trim());
                        setPartialTranscript("");
                    }

                    if (data.transcript && data.is_partial) {
                        setPartialTranscript(data.transcript);
                    }
                } catch {
                    console.warn("Could not parse WS message:", event.data);
                }
            };
        } catch (error) {
            console.error("Error starting Deepgram:", error);
            alert(error.message || "Failed to start microphone or WebSocket");
        }
    };

    const setupAudioProcessing = (stream, ws) => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            if (pausedRef.current) return;
            if (ws.readyState !== WebSocket.OPEN) return;

            const input = e.inputBuffer.getChannelData(0);

            const pcm16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                let s = Math.max(-1, Math.min(1, input[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            ws.send(pcm16.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
    };

    const stopListening = () => {
        console.log("Stopping Deepgram...");

        pausedRef.current = false;
        setPaused(false);

        try {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ event: "stop" }));
                setTimeout(() => wsRef.current?.close(), 200);
            }
        } catch (e) {
            console.log(e)
        }

        processorRef.current?.disconnect();
        processorRef.current = null;

        audioContextRef.current?.close();
        audioContextRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        setListening(false);
    };

    const pauseListening = () => {
        pausedRef.current = true;
        setPaused(true);
    };

    const resumeListening = () => {
        pausedRef.current = false;
        setPaused(false);
    };

    const clearTranscript = () => {
        accumulatedRef.current = "";
        setTranscript("");
        setPartialTranscript("");
    };

    useEffect(() => {
        return () => stopListening();
    }, []);

    return {
        listening,
        paused,
        transcript: transcript + (partialTranscript ? " " + partialTranscript : ""),
        finalTranscript: transcript,
        partialTranscript,
        startListening,
        stopListening,
        pauseListening,
        resumeListening,
        clearTranscript,
        setTranscript
    };
}

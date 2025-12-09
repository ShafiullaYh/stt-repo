import { useEffect, useRef, useState } from "react";

const ASSEMBLY_WS_URL = "ws://localhost:5000/ws?service=assemblyai";

export default function useAssemblyAI() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [partialTranscript, setPartialTranscript] = useState("");

    const wsRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);

    // ----------------------------------------------------------
    // 🔵 Start Listening
    // ----------------------------------------------------------
    const startListening = async () => {
        try {
            const ws = new WebSocket(ASSEMBLY_WS_URL);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log("Frontend → WebSocket connected");

                // IMPORTANT FIX: Set binaryType here
                ws.binaryType = "arraybuffer";

                // Tell backend to start AssemblyAI session
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

                mediaStreamRef.current = stream;

                startAudioProcessing(stream, ws);

                setTranscript("");
                setPartialTranscript("");
                setListening(true);
            };

            ws.onerror = (e) => console.error("WS Error:", e);
            ws.onclose = () => {
                console.log("WS closed");
                setListening(false);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.transcript && data.is_final) {
                    setTranscript((prev) =>
                        (prev ? prev + " " + data.transcript : data.transcript).trim()
                    );
                    setPartialTranscript("");
                }

                if (data.transcript && data.is_partial) {
                    setPartialTranscript(data.transcript);
                }
            };
        } catch (err) {
            console.error(err);
            alert(err.message || "Failed to start AssemblyAI");
        }
    };

    // ----------------------------------------------------------
    // 🎤 Audio → PCM16 → Backend WS
    // ----------------------------------------------------------
    const startAudioProcessing = (stream, ws) => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;

            const input = e.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(input.length);

            for (let i = 0; i < input.length; i++) {
                let s = Math.max(-1, Math.min(1, input[i]));
                pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            ws.send(pcm.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
    };

    // ----------------------------------------------------------
    // 🔴 Stop Listening
    // ----------------------------------------------------------
    const stopListening = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: "stop" }));
            setTimeout(() => wsRef.current?.close(), 200);
        }

        processorRef.current?.disconnect();
        audioContextRef.current?.close();
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());

        processorRef.current = null;
        audioContextRef.current = null;
        mediaStreamRef.current = null;

        setListening(false);
    };

    useEffect(() => {
        return () => stopListening();
    }, []);

    // Public API of the hook
    return {
        listening,
        transcript: transcript + (partialTranscript ? " " + partialTranscript : ""),
        finalTranscript: transcript,
        partialTranscript,
        setTranscript,
        startListening,
        stopListening,
    };
}

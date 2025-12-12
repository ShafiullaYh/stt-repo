import { useRef, useState } from "react";

const getWebSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL
    || "http://localhost:5000";
  const protocol = apiUrl.startsWith("https") ? "wss" : "ws";
  const host = apiUrl.replace(/^https?:\/\//, "");
  return `${protocol}://${host}/ws?service=assemblyai`;
};

const AAI_URL = getWebSocketURL();

export default function useAssemblyAI() {
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

  // ---------------------------
  // START
  // ---------------------------
  const startListening = async () => {
    const ws = new WebSocket(AAI_URL);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      ws.send(JSON.stringify({ event: "start" }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
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

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);

        if (data.transcript && data.is_final) {
          accumulatedRef.current += " " + data.transcript;
          setTranscript(accumulatedRef.current.trim());
          setPartialTranscript("");
        }

        if (data.transcript && data.is_partial) {
          setPartialTranscript(data.transcript);
        }
      } catch (e) {
        console.log(e)
      }
    };

    ws.onclose = () => setListening(false);
  };

  // ---------------------------
  // AUDIO PROCESSING
  // ---------------------------
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

  // ---------------------------
  // STOP SAFE
  // ---------------------------
  const stopListening = async () => {
    pausedRef.current = false;
    setPaused(false);

    try {
      wsRef.current?.send(JSON.stringify({ event: "stop" }));
      setTimeout(() => wsRef.current?.close(), 100);
    } catch (e) {
      console.log(e)
    }

    try { processorRef.current?.disconnect(); } catch (e) {
      console.log(e)
    }
    processorRef.current = null;

    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          await audioContextRef.current.close();
        }
      } catch (e) {
        console.warn("AssemblyAI AudioContext already closed", e);
      }
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {
        console.log(e)
      }
      streamRef.current = null;
    }

    setListening(false);
  };

  // ---------------------------
  // PAUSE / RESUME
  // ---------------------------
  const pauseListening = () => {
    pausedRef.current = true;
    setPaused(true);
  };

  const resumeListening = () => {
    pausedRef.current = false;
    setPaused(false);
  };

  return {
    listening,
    paused,
    transcript: transcript + (partialTranscript ? " " + partialTranscript : ""),
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    setTranscript,
  };
}

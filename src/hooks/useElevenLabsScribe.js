import { useState, useRef } from "react";
import { useScribe } from "@elevenlabs/react";
import { AppActions } from "../utilities/actions";

export default function useElevenLabsScribe() {
    const [listening, setListening] = useState(false);
    const [paused, setPaused] = useState(false);
    const pausedRef = useRef(false);

    const [transcript, setTranscript] = useState("");

    const scribe = useScribe({
        modelId: "scribe_v2_realtime",
        languageCode: "en",
        includeTimestamps: true,
        commitStrategy: "vad",

        onCommittedTranscript: (data) => {
            if (!pausedRef.current) {
                setTranscript((p) => (p + " " + data.text).trim());
            }
        },
    });

    const fetchToken = async () => {
        const res = await AppActions.makeApiCall("get", "speechToText/scribe-token");
        if (res?.data?.token) return res.data.token;
        throw new Error("Token fetch failed");
    };

    const startListening = async () => {
        if (scribe.status === "recording") return;

        const token = await fetchToken();

        await scribe.connect({
            token,
            microphone: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            }
        });

        pausedRef.current = false;
        setPaused(false);
        setTranscript("");
        setListening(true);
    };

    const stopListening = () => {
        pausedRef.current = false;
        setPaused(false);

        try { scribe.disconnect(); } catch (e) {
            console.log(e)
        }
        setListening(false);
    };

    const pauseListening = () => {
        pausedRef.current = true;
        setPaused(true);

        try { scribe.pause?.(); } catch (e) {
            console.log(e)
        }
    };

    const resumeListening = () => {
        pausedRef.current = false;
        setPaused(false);

        try { scribe.resume?.(); } catch (e) {
            console.log(e)
        }
    };

    return {
        listening,
        paused,
        transcript,
        startListening,
        stopListening,
        pauseListening,
        resumeListening,
        setTranscript,
    };
}

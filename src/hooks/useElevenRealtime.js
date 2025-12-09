import { useEffect, useState } from "react";
import { useScribe } from "@elevenlabs/react";
// import { AppActions } from "../../redux/actions/actions";

export default function useElevenLabsScribe() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    // ---- Scribe Instance ----
    const scribe = useScribe({
        modelId: "scribe_v2_realtime",
        languageCode: "en",
        includeTimestamps: true,
        commitStrategy: "vad",
        vadSilenceThresholdSecs: 1.2,
        vadThreshold: 0.4,

        onCommittedTranscript: (data) => {
            setTranscript((prev) => prev + " " + data.text);
        },

        onPartialTranscript: (partial) => {
            console.log("Partial:", partial);
        }
    });


    const fetchToken = async () => {
        // const res = await AppActions.makeApiCall("get", "speechToText/scribe-token", {});
        // if (res?.data?.token) {
        //     return res.data.token;
        // }
        throw new Error("Token fetch failed");
    };

    // ---- Start Listening ----
    const startListening = async () => {
        console.log("checking for start Listening fucntion", scribe.status)
        try {
            // Prevent double connections
            if (["connecting", "ready", "recording"].includes(scribe.status)) {
                console.warn("Already connected");
                return;
            }

            const token = await fetchToken();

            await scribe.connect({
                token,
                microphone: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            setTranscript("");
            setListening(true);
        } catch (err) {
            console.error("Error starting:", err);
            alert("Failed to start recording");
        }
    };

    // ---- Stop Listening ----
    const stopListening = () => {
        console.log("checking for stop Listening fucntion", scribe.status)
        try {
            if (["transcribing"].includes(scribe.status)) {
                scribe.disconnect();
            }
        } catch (err) {
            console.error("Disconnect error:", err);
        }

        setListening(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopListening();
    }, []);

    return {
        listening,
        transcript,
        startListening,
        stopListening,
        setTranscript,
    };
}

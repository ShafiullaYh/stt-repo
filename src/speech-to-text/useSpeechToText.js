import { useEffect, useRef, useState } from "react";

export default function useSpeechToText() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            setTranscript(text);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;
    }, []);

    const startListening = () => {
        setTranscript("");
        setListening(true);
        recognitionRef.current.start();
    };

    const stopListening = () => {
        setListening(false);
        recognitionRef.current.stop();
    };

    return {
        transcript,
        setTranscript,
        listening,
        startListening,
        stopListening
    };
}

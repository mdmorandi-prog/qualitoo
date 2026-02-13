import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  mode: "web-speech" | "elevenlabs";
  elevenLabsApiKey?: string;
}

const VoiceRecorder = ({ onTranscript, mode }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [partialText, setPartialText] = useState("");
  const recognitionRef = useRef<any>(null);

  // ─── Web Speech API ───
  const startWebSpeech = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
          onTranscript(finalTranscript.trim());
        } else {
          interim += t;
        }
      }
      setPartialText(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Permissão do microfone negada.");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setPartialText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.info("🎙️ Gravação iniciada — fale agora");
  }, [onTranscript]);

  // ─── ElevenLabs STT (batch via edge function) ───
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startElevenLabs = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsProcessing(true);

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`,
            {
              method: "POST",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: formData,
            }
          );

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Erro ${res.status}`);
          }

          const data = await res.json();
          if (data.text) {
            onTranscript(data.text);
            toast.success("Transcrição concluída!");
          } else {
            toast.warning("Nenhum texto detectado.");
          }
        } catch (err: any) {
          console.error("ElevenLabs transcription error:", err);
          toast.error(err.message || "Erro na transcrição ElevenLabs");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.info("🎙️ Gravação ElevenLabs iniciada — fale agora");
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  }, [onTranscript]);

  const handleStart = () => {
    if (mode === "web-speech") startWebSpeech();
    else startElevenLabs();
  };

  const handleStop = () => {
    if (mode === "web-speech" && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (mode === "elevenlabs" && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStart}
            disabled={isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isProcessing ? "Transcrevendo..." : "Iniciar Gravação"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleStop}
            className="gap-2"
          >
            <Square className="h-3 w-3" />
            Parar
          </Button>
        )}

        {isRecording && (
          <Badge variant="destructive" className="animate-pulse gap-1">
            <MicOff className="h-3 w-3" /> Gravando...
          </Badge>
        )}

        <Badge variant="secondary" className="text-xs">
          {mode === "web-speech" ? "Web Speech API" : "ElevenLabs STT"}
        </Badge>
      </div>

      {partialText && (
        <p className="text-xs italic text-muted-foreground rounded-md bg-muted/50 p-2">
          {partialText}
        </p>
      )}
    </div>
  );
};

export default VoiceRecorder;

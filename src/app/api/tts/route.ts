import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Google Cloud Text-to-Speech API configuration
// Supports high-quality voices for Indian languages

// Map language names to Google Cloud TTS voice configurations
const VOICE_CONFIG: Record<string, { languageCode: string; name: string; ssmlGender: string }> = {
  English: { languageCode: "en-IN", name: "en-IN-Wavenet-D", ssmlGender: "MALE" },
  Hindi: { languageCode: "hi-IN", name: "hi-IN-Wavenet-D", ssmlGender: "MALE" },
  Tamil: { languageCode: "ta-IN", name: "ta-IN-Wavenet-D", ssmlGender: "MALE" },
  Telugu: { languageCode: "te-IN", name: "te-IN-Standard-B", ssmlGender: "MALE" },
  Kannada: { languageCode: "kn-IN", name: "kn-IN-Wavenet-D", ssmlGender: "MALE" },
  Malayalam: { languageCode: "ml-IN", name: "ml-IN-Wavenet-D", ssmlGender: "MALE" },
  Marathi: { languageCode: "mr-IN", name: "mr-IN-Wavenet-B", ssmlGender: "MALE" },
  Gujarati: { languageCode: "gu-IN", name: "gu-IN-Wavenet-B", ssmlGender: "MALE" },
  Bengali: { languageCode: "bn-IN", name: "bn-IN-Wavenet-B", ssmlGender: "MALE" },
  Punjabi: { languageCode: "pa-IN", name: "pa-IN-Wavenet-D", ssmlGender: "MALE" },
};

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: "TTS API not configured",
        fallback: true 
      }, { status: 503 });
    }

    // Get voice configuration for the language
    const voiceConfig = VOICE_CONFIG[language] || VOICE_CONFIG.English;

    // Prepare the request to Google Cloud TTS
    const ttsRequest = {
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9, // Slightly slower for clarity
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    // Call Google Cloud TTS API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ttsRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Google TTS API error:", errorData);
      
      // If quota exceeded or API error, signal to use fallback
      return NextResponse.json({ 
        error: "TTS API error",
        fallback: true 
      }, { status: 503 });
    }

    const data = await response.json();
    
    // Return base64 encoded audio
    return NextResponse.json({
      audioContent: data.audioContent,
      contentType: "audio/mp3",
    });

  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ 
      error: "Failed to generate speech",
      fallback: true 
    }, { status: 500 });
  }
}

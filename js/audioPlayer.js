export async function playCueAudioWithFallback({
  cue_text,
  delivery_style,
  voice_id,
  api_key,
  returnUrl = false,
  voice_settings = null
}) {
  const defaultProfiles = {
    calm: { stability: 0.75, similarity_boost: 0.8, style: 0.1 },
    reassuring: { stability: 0.7, similarity_boost: 0.85, style: 0.2 },
    direct: { stability: 0.4, similarity_boost: 0.75, style: 0.0 },
    analytical: { stability: 0.6, similarity_boost: 0.7, style: 0.0 },
    motivational: { stability: 0.5, similarity_boost: 0.75, style: 0.6 },
    focused: { stability: 0.6, similarity_boost: 0.8, style: 0.1 },
    neutral: { stability: 0.5, similarity_boost: 0.75, style: 0.0 }
  };

  const settings = voice_settings || defaultProfiles[delivery_style] || defaultProfiles["neutral"];

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": api_key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: cue_text,
          model_id: "eleven_multilingual_v2",
          voice_settings: settings
        })
      }
    );

    if (!response.ok) throw new Error("Audio generation failed");

    const audioBuffer = await response.arrayBuffer();
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);

    if (returnUrl) return url;

    const audio = new Audio(url);
    audio.play();
  } catch (err) {
    console.error("Playback error:", err);
    const fallbackAudio = new Audio("/assets/sounds/fallback-audio.mp3");
    fallbackAudio.play();
  }
}

export function formatCueData(raw) {
  const pkg = raw.final_cue_package || {};
  return {
    session_id: raw.session_id || "unknown-session",
    plan: raw.plan || "No orchestration plan available.",
    timestamp: raw.timestamp || new Date().toISOString(),
    final_cue_package: {
      cue_text: pkg.cue_text || "[No cue text available]",
      delivery_style: pkg.delivery_style || "neutral",
      persona: pkg.persona || "UnknownCoach",
      player_state: pkg.player_state || {
        fatigue_level: 0.0,
        performance_state: "Unknown"
      },
      chat_history: pkg.chat_history || []
    }
  };
}

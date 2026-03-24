export const playbackHistory = [
  {
    session_id: "demo-a1",
    plan: "SK Plan: Simulated tactical adjustment.",
    timestamp: new Date().toISOString(),
    final_cue_package: {
      cue_text: "Maintain this intensity. Your focus is forcing errors.",
      delivery_style: "direct",
      persona: "TacticalCoach",
      player_state: { fatigue_level: 0.35, performance_state: "Optimal" },
      chat_history: [
        {
          name: "OrchestrationCore",
          content: "Fatigue=0.35, Performance='Optimal'. Simulated session."
        },
        {
          name: "TacticalCoach",
          content:
            '{"cue_text": "Maintain this intensity. Your focus is forcing errors.", "delivery_style": "direct"}'
        }
      ]
    }
  }
];

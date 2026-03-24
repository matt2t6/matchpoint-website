export function mockTelemetryFeed(onCueGenerated) {
  const personas = ["TacticalCoach", "RecoveryCoach", "MentalResetAgent"];

  setInterval(() => {
    const fatigue = Math.random();
    const sessionId = "demo-" + Date.now();
    const performance =
      fatigue > 0.7 ? "Degrading" : fatigue > 0.4 ? "Stable" : "Optimal";

    const cueText =
      fatigue > 0.8
        ? "You're pushing your limits. Recover now before errors creep in."
        : performance === "Degrading"
        ? "Reset. See the ball. Trust your swing."
        : "Maintain this focus. You're pressing the advantage.";

    const delivery_style =
      fatigue > 0.8 ? "calm" : performance === "Degrading" ? "focused" : "direct";

    const persona =
      fatigue > 0.8
        ? "RecoveryCoach"
        : performance === "Degrading"
        ? "MentalResetAgent"
        : "TacticalCoach";

    const cue = {
      session_id: sessionId,
      plan: "SK Plan: Demo simulation",
      timestamp: new Date().toISOString(),
      final_cue_package: {
        cue_text: cueText,
        delivery_style,
        persona,
        player_state: { fatigue_level: fatigue, performance_state: performance },
        chat_history: [
          {
            name: "OrchestrationCore",
            content: `Simulated input: Fatigue=${fatigue.toFixed(
              2
            )}, Performance='${performance}'`
          },
          {
            name: persona,
            content: JSON.stringify({ cue_text: cueText, delivery_style })
          }
        ]
      }
    };

    onCueGenerated(cue);
  }, 5000); // Fires every 5 seconds
}

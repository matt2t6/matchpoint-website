// ===========================
// MATCHPOINT COMEBACK EPIC TIMELINE
// ===========================
// Complete 5-minute cinematic tennis comeback story
// From doubt to domination: 16 detailed story beats across 4 phases

export const comebackEpic = {
  metadata: {
    totalDuration: 300, // 5 minutes
    phases: 4,
    totalBeats: 16,
    description: 'From doubt to domination: Complete cinematic tennis comeback'
  },

  // PHASE 1: STRUGGLE (0:00 - 1:30) - Confidence drops, accuracy falls, emotions crash
  struggle: [
    {
      id: 'struggle_1',
      time: 0,
      duration: 15,
      metrics: {
        serve_speed: { target: 118, variance: 5 },
        spin_rate: { target: 2800, variance: 200 },
        shot_accuracy: { target: 78, variance: 8 },
        reaction_time: { target: 0.32, variance: 0.05 },
        court_coverage: { target: 68, variance: 6 }
      },
      audio: { sfx: 'crowd_murmur', ambient: 'crowd_noise', music: null },
      coaching: {
        cue: "Stay focused on your breathing. This is just a temporary dip.",
        duration: 3000,
        priority: 'high'
      },
      scoreboard: { player1_score: '0-0', player2_score: '0-0' }
    },
    {
      id: 'struggle_2',
      time: 15,
      duration: 20,
      metrics: {
        serve_speed: { target: 115, variance: 6 },
        spin_rate: { target: 2700, variance: 250 },
        shot_accuracy: { target: 75, variance: 10 },
        reaction_time: { target: 0.35, variance: 0.06 },
        court_coverage: { target: 65, variance: 8 }
      },
      audio: { sfx: 'racket_miss', ambient: 'crowd_concerned', music: null },
      coaching: {
        cue: "Your form is solid. Trust the process - these rallies will turn.",
        duration: 3500,
        priority: 'medium'
      },
      scoreboard: { player1_score: '0-0', player2_score: '0-0' }
    },
    {
      id: 'struggle_3',
      time: 35,
      duration: 25,
      metrics: {
        serve_speed: { target: 112, variance: 7 },
        spin_rate: { target: 2600, variance: 300 },
        shot_accuracy: { target: 72, variance: 12 },
        reaction_time: { target: 0.38, variance: 0.07 },
        court_coverage: { target: 62, variance: 10 }
      },
      audio: { sfx: 'crowd_gasp', ambient: 'crowd_worried', music: null },
      coaching: {
        cue: "I see the frustration building. Channel it into your next serve.",
        duration: 4000,
        priority: 'high'
      },
      scoreboard: { player1_score: '0-1', player2_score: '0-0' }
    },
    {
      id: 'struggle_4',
      time: 60,
      duration: 30,
      metrics: {
        serve_speed: { target: 110, variance: 8 },
        spin_rate: { target: 2500, variance: 350 },
        shot_accuracy: { target: 68, variance: 15 },
        reaction_time: { target: 0.42, variance: 0.08 },
        court_coverage: { target: 58, variance: 12 }
      },
      audio: { sfx: 'double_fault', ambient: 'crowd_silent', music: null },
      coaching: {
        cue: "This is the moment where champions dig deep. You've got the heart.",
        duration: 4500,
        priority: 'critical'
      },
      scoreboard: { player1_score: '0-2', player2_score: '0-0' }
    }
  ],

  // PHASE 2: TURNING POINT (1:30 - 3:00) - AI activates, metrics improve rapidly, momentum builds
  turningPoint: [
    {
      id: 'turning_1',
      time: 90,
      duration: 20,
      metrics: {
        serve_speed: { target: 120, variance: 4 },
        spin_rate: { target: 2900, variance: 150 },
        shot_accuracy: { target: 82, variance: 6 },
        reaction_time: { target: 0.28, variance: 0.04 },
        court_coverage: { target: 72, variance: 5 }
      },
      audio: { sfx: 'ace_serve', ambient: 'crowd_surprised', music: 'motivational_build' },
      coaching: {
        cue: "There it is! That serve had perfect placement. Keep that focus!",
        duration: 3500,
        priority: 'high'
      },
      scoreboard: { player1_score: '1-2', player2_score: '0-0' }
    },
    {
      id: 'turning_2',
      time: 110,
      duration: 25,
      metrics: {
        serve_speed: { target: 125, variance: 3 },
        spin_rate: { target: 3100, variance: 120 },
        shot_accuracy: { target: 86, variance: 4 },
        reaction_time: { target: 0.25, variance: 0.03 },
        court_coverage: { target: 78, variance: 4 }
      },
      audio: { sfx: 'winner_forehand', ambient: 'crowd_cheering', music: 'motivational_rise' },
      coaching: {
        cue: "Beautiful! Your forehand is singing. Stay aggressive on the return.",
        duration: 4000,
        priority: 'high'
      },
      scoreboard: { player1_score: '2-2', player2_score: '0-0' }
    },
    {
      id: 'turning_3',
      time: 135,
      duration: 30,
      metrics: {
        serve_speed: { target: 128, variance: 2 },
        spin_rate: { target: 3200, variance: 100 },
        shot_accuracy: { target: 89, variance: 3 },
        reaction_time: { target: 0.22, variance: 0.02 },
        court_coverage: { target: 82, variance: 3 }
      },
      audio: { sfx: 'rally_winner', ambient: 'crowd_excited', music: 'motivational_peak' },
      coaching: {
        cue: "You're in the zone now! Every shot has purpose. Break point coming!",
        duration: 4500,
        priority: 'critical'
      },
      scoreboard: { player1_score: '3-2', player2_score: '0-0' }
    },
    {
      id: 'turning_4',
      time: 165,
      duration: 15,
      metrics: {
        serve_speed: { target: 130, variance: 1 },
        spin_rate: { target: 3300, variance: 80 },
        shot_accuracy: { target: 92, variance: 2 },
        reaction_time: { target: 0.20, variance: 0.01 },
        court_coverage: { target: 85, variance: 2 }
      },
      audio: { sfx: 'break_point', ambient: 'crowd_intense', music: 'motivational_climax' },
      coaching: {
        cue: "BREAK POINT! Stay composed. This is your moment.",
        duration: 3000,
        priority: 'critical'
      },
      scoreboard: { player1_score: '4-2', player2_score: '0-0' }
    }
  ],

  // PHASE 3: CHALLENGE (3:00 - 4:00) - Opponent fights back, but player maintains control
  challenge: [
    {
      id: 'challenge_1',
      time: 180,
      duration: 20,
      metrics: {
        serve_speed: { target: 126, variance: 3 },
        spin_rate: { target: 3150, variance: 120 },
        shot_accuracy: { target: 87, variance: 5 },
        reaction_time: { target: 0.24, variance: 0.03 },
        court_coverage: { target: 80, variance: 4 }
      },
      audio: { sfx: 'opponent_comeback', ambient: 'crowd_tense', music: 'tense_build' },
      coaching: {
        cue: "They're fighting back hard. Stay patient - don't force the winner.",
        duration: 4000,
        priority: 'high'
      },
      scoreboard: { player1_score: '4-3', player2_score: '0-0' }
    },
    {
      id: 'challenge_2',
      time: 200,
      duration: 25,
      metrics: {
        serve_speed: { target: 124, variance: 4 },
        spin_rate: { target: 3050, variance: 150 },
        shot_accuracy: { target: 84, variance: 6 },
        reaction_time: { target: 0.26, variance: 0.04 },
        court_coverage: { target: 76, variance: 5 }
      },
      audio: { sfx: 'long_rally', ambient: 'crowd_holding_breath', music: 'tense_sustain' },
      coaching: {
        cue: "Great defense! Now look for the opportunity to dictate the point.",
        duration: 4500,
        priority: 'medium'
      },
      scoreboard: { player1_score: '4-4', player2_score: '0-0' }
    },
    {
      id: 'challenge_3',
      time: 225,
      duration: 15,
      metrics: {
        serve_speed: { target: 129, variance: 2 },
        spin_rate: { target: 3250, variance: 100 },
        shot_accuracy: { target: 90, variance: 3 },
        reaction_time: { target: 0.21, variance: 0.02 },
        court_coverage: { target: 83, variance: 3 }
      },
      audio: { sfx: 'hold_serve', ambient: 'crowd_relieved', music: 'triumphant' },
      coaching: {
        cue: "Perfect! You held serve under pressure. Championship mentality!",
        duration: 3500,
        priority: 'high'
      },
      scoreboard: { player1_score: '5-4', player2_score: '0-0' }
    }
  ],

  // PHASE 4: CLIMAX (4:00 - 5:00) - Epic final rally, match point, VICTORY
  climax: [
    {
      id: 'climax_1',
      time: 240,
      duration: 20,
      metrics: {
        serve_speed: { target: 132, variance: 1 },
        spin_rate: { target: 3350, variance: 70 },
        shot_accuracy: { target: 94, variance: 2 },
        reaction_time: { target: 0.18, variance: 0.01 },
        court_coverage: { target: 88, variance: 2 }
      },
      audio: { sfx: 'match_point', ambient: 'crowd_electric', music: 'epic_climax' },
      coaching: {
        cue: "MATCH POINT! You've earned this. Finish strong!",
        duration: 4000,
        priority: 'critical'
      },
      scoreboard: { player1_score: '5-4', player2_score: '0-0' }
    },
    {
      id: 'climax_2',
      time: 260,
      duration: 25,
      metrics: {
        serve_speed: { target: 135, variance: 0 },
        spin_rate: { target: 3400, variance: 50 },
        shot_accuracy: { target: 96, variance: 1 },
        reaction_time: { target: 0.16, variance: 0.005 },
        court_coverage: { target: 92, variance: 1 }
      },
      audio: { sfx: 'epic_rally', ambient: 'crowd_screaming', music: 'epic_finale' },
      coaching: {
        cue: "This is poetry in motion! Every shot perfect. You're a champion!",
        duration: 5000,
        priority: 'critical'
      },
      scoreboard: { player1_score: '5-4', player2_score: '0-0' }
    },
    {
      id: 'climax_3',
      time: 285,
      duration: 15,
      metrics: {
        serve_speed: { target: 140, variance: 0 },
        spin_rate: { target: 3500, variance: 0 },
        shot_accuracy: { target: 100, variance: 0 },
        reaction_time: { target: 0.14, variance: 0 },
        court_coverage: { target: 95, variance: 0 }
      },
      audio: { sfx: 'victory_scream', ambient: 'crowd_explosion', music: 'victory_theme' },
      coaching: {
        cue: "VICTORY! You did it! What a comeback! What a champion!",
        duration: 6000,
        priority: 'victory'
      },
      scoreboard: { player1_score: '6-4', player2_score: '0-0' }
    }
  ]
};

// Legacy export for backward compatibility
export const COMEBACK_EPIC_TIMELINE = comebackEpic;




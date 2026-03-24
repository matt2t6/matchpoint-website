// Cue Scheduler: prewarm persona/sample phrases ahead of time
// Requires backend /api/tts/prepare and VoiceEngine instance

export function createCueScheduler({ voiceEngine }) {
  async function prepareAndPreload({ text, persona }) {
    try {
      const prep = await fetch('/api/tts/prepare', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, persona })
      }).then(r=>r.json()).catch(()=>null);
      if (!prep) return false;
      const started = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const maxPollMs = 5000, pollEvery = 300;
      let url = prep.url || null;
      while (!url) {
        await new Promise(r=>setTimeout(r, pollEvery));
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started;
        if (elapsed > maxPollMs) break;
        const st = await fetch(`/api/tts/status?id=${encodeURIComponent(prep.jobId||'')}`).then(r=>r.json()).catch(()=>null);
        if (st?.ready && st?.url) { url = st.url; break; }
      }
      if (url) {
        try { await voiceEngine.preloadUrl(url); return true; } catch { return false; }
      }
      return false;
    } catch { return false; }
  }

  function sampleForPersona(p) {
    const SAMPLES = {
      TacticalCoach: 'Primed: Precision over power. Own the court.',
      MentalResetAgent: 'Primed: Breathe. Reset. Confidence returns now.',
      RecoveryCoach: 'Primed: Control your tempo. Recover with composure.',
      system_neutral: 'System voice: status nominal.'
    };
    return SAMPLES[p] || 'Voice test: This is a sample line.';
  }

  async function prewarmPersona(persona) {
    const ok = await prepareAndPreload({ text: sampleForPersona(persona), persona });
    return ok;
  }

  return { prewarmPersona };
}


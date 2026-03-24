export async function logEvent(event, payload = {}) {
  try {
    await fetch('/api/soul/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload })
    });
  } catch (_) {}
}


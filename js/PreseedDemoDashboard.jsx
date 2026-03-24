import React, { useEffect, useState } from 'react';
import api, { login } from '../utils/apiClient';

export default function PreseedDemoDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [services, setServices] = useState([]);
  const [echo, setEcho] = useState(null);
  const [live, setLive] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sampleCue, setSampleCue] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Auto-login viewer
        await login('viewer', 'viewer123');
        const [h, s, e, l, tc] = await Promise.all([
          api.health(),
          api.services(),
          api.echoResonance().catch(() => null),
          api.liveStatus().catch(() => null),
          api.tennisCategories().catch(() => ({ categories: [] })),
        ]);
        setHealth(h);
        setServices(s.services || []);
        setEcho(e);
        setLive(l);
        const cats = (tc.categories || []).map(c => c.name || c);
        setCategories(cats);
        if (cats.length) {
          const cue = await api.tennisCueByCategory(cats[0]);
          setSampleCue(cue);
        }
      } catch (err) {
        setError(err.message || 'Failed to load pre-seed data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8">Loading pre-seed demo...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="glass-card p-6 border border-cyan-500/30">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Gateway Health</h2>
        <p>Status: <span className="font-semibold">{health?.status}</span></p>
        <p>Services monitored: {services.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-cyan-500/30">
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Echo Protocol</h3>
          {echo ? (
            <ul className="space-y-1 text-gray-300">
              <li>Resonance: {echo.resonance_amplification ?? '—'}%</li>
              <li>Emotion: {echo.emotional_harmony ?? '—'}%</li>
              <li>Ring Size: {echo.collaborative_ring_size ?? '—'}</li>
            </ul>
          ) : (
            <p className="text-gray-400">Echo service not available</p>
          )}
        </div>

        <div className="glass-card p-6 border border-cyan-500/30">
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Live Data Bridge</h3>
          {live ? (
            <ul className="space-y-1 text-gray-300">
              <li>Active Connections: {live.active_connections}</li>
              <li>Latency Avg: {live.latency_avg} ms</li>
              <li>Throughput: {live.data_throughput}</li>
            </ul>
          ) : (
            <p className="text-gray-400">Live bridge not available</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 border border-cyan-500/30">
        <h3 className="text-xl font-bold text-cyan-400 mb-2">Tennis Coaching</h3>
        <p className="text-gray-300 mb-2">Categories detected: {categories.join(', ') || '—'}</p>
        {sampleCue && (
          <div className="p-4 bg-gray-800/50 rounded">
            <div className="text-sm text-gray-400">Sample cue ({sampleCue.category}):</div>
            <div className="text-cyan-300 font-semibold">{sampleCue.cue}</div>
          </div>
        )}
      </div>
    </div>
  );
}



import React, { useEffect, useState } from 'react';

export default function SystemStatusWidget() {
  const [widget, setWidget] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/status.json?' + Date.now());
        const data = await res.json();
        const system = data?.system;

        if (!system) {
          return setWidget(
            <div className="glass-card p-4 text-sm text-red-500">
              ❌ No system data available.
            </div>
          );
        }

        const { deployHash, lastAudit, personas } = system;
        const active = personas?.active ?? 'N/A';
        const needsUpdate = personas?.needsUpdate ?? 'N/A';

        const formattedDate = lastAudit
          ? new Date(lastAudit).toUTCString().replace('GMT', 'UTC')
          : 'Unknown';

        const freshnessWarning =
          Date.now() - new Date(lastAudit).getTime() > 6 * 60 * 60 * 1000 ? (
            <span className="text-xs ml-2 text-yellow-400 italic">
              ⚠️ Audit data may be stale
            </span>
          ) : null;

        setWidget(
          <div className="glass-card p-4 rounded-md space-y-2 text-sm mt-6">
            <h3 className="text-lg text-green-400 font-semibold">
              ✅ MatchPoint System Status
            </h3>
            <div className="text-green-400">
              Last Audit: {formattedDate} {freshnessWarning}
            </div>
            <div className="text-cyan-300">
              Deploy Hash: <code>{deployHash || 'Unavailable'}</code>
            </div>
            <div className="text-blue-300">
              Personas: {active} active / {needsUpdate} need update
            </div>
          </div>
        );
      } catch (err) {
        setWidget(
          <div className="glass-card p-4 text-sm text-red-500">
            ❌ Error loading system status data.
          </div>
        );
      }
    })();
  }, []);

  return <>{widget}</>;
}

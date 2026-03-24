import React, { useEffect, useState } from 'react';

export default function TrustStatusWidget({ personaSlug }) {
  const [widget, setWidget] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/status.json?' + Date.now());
        const data = await res.json();
        const personaData = data[personaSlug];

        if (!personaData) {
          return setWidget(
            <p className="text-red-500">❌ Unknown persona: {personaSlug}</p>
          );
        }

        const tally = { complete: 0, in_progress: 0, missing: 0 };
        const cues = Object.entries(personaData).filter(
          ([k]) => k !== 'lastUpdated'
        );
        cues.forEach(([_, status]) => {
          if (tally[status] !== undefined) tally[status]++;
        });

        const completeList = cues
          .filter(([_, v]) => v === 'complete')
          .map(([k]) => k);
        const missingList = cues
          .filter(([_, v]) => v === 'missing')
          .map(([k]) => k);
        const readyCount = tally.complete + tally.in_progress;
        const completionRate = Math.round((readyCount / cues.length) * 100);

        const summaryText =
          completeList.length || missingList.length
            ? `${personaSlug} is preparing for rollout. ${
                completeList.length
                  ? `${completeList.join(' and ')} ${
                      completeList.length > 1 ? 'are' : 'is'
                    } calibrated.`
                  : ''
              } ${
                missingList.length
                  ? `${missingList.join(' and ')} ${
                      missingList.length > 1 ? 'are' : 'is'
                    } missing.`
                  : ''
              }`
            : `${personaSlug} is initializing.`

        let rating = 'Not Deployable',
          icon = '🟥',
          color = 'red-500';
        if (readyCount >= 4) {
          rating = 'Ready to Compete';
          icon = '🟩';
          color = 'green-500';
        } else if (tally.missing >= 2) {
          rating = 'Needs Calibration';
          icon = '🟨';
          color = 'yellow-500';
        }

        const updatedDate = new Date(personaData.lastUpdated);
        const ageHours = Math.floor(
          (Date.now() - updatedDate.getTime()) / 36e5
        );
        const freshnessBadge =
          ageHours >= 6 ? (
            <span className="badge-alert text-xs ml-2">
              ⚠️ {ageHours}h stale
            </span>
          ) : null;

        const cueLines = cues.map(([cue, status]) => {
          const colorClass =
            status === 'complete'
              ? 'text-green-400'
              : status === 'in_progress'
              ? 'text-yellow-400'
              : 'text-red-400';
          return (
            <div key={cue} className={colorClass}>
              • {cue}: <strong>{status.replace('_', ' ')}</strong>
            </div>
          );
        });

        const widgetBody = (
          <div className="glass-card p-4 mt-6 rounded-md space-y-2 text-sm">
            <h3 className="text-lg text-sky-400 font-semibold">
              Trust Status: {personaSlug}
            </h3>
            {cueLines}
            <div className="mt-3 text-xs italic text-slate-400">
              Coverage: 🟢 {tally.complete} / 🟡 {tally.in_progress} / 🔴{' '}
              {tally.missing}
            </div>
            <div className="mt-3 group cursor-pointer">
              <span className={`font-semibold text-${color}`}>
                {icon} {rating}
              </span>
              <div className="text-xs text-slate-300 italic mt-1">
                {summaryText}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Last Updated: {updatedDate.toUTCString().replace('GMT', 'UTC')}{' '}
              {freshnessBadge}
            </div>
            <div className="bg-gray-800 h-2 rounded-full w-full mt-2">
              <div
                className={`bg-matchpoint h-2 rounded-full ${
                  completionRate > 50 ? 'animate-pulse' : ''
                }`}
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 italic mt-1">
              Cue readiness: {completionRate}%
            </p>
          </div>
        );

        setWidget(widgetBody);
      } catch (err) {
        setWidget(
          <p className="text-red-500">❌ Error loading trust data widget.</p>
        );
      }
    })();
  }, [personaSlug]);

  return <>{widget}</>;
}

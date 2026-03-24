import Chart from 'chart.js/auto';

let sensorWeightsChart, driftChart, cueBiasChart, emotionalBaselineChart;

export function initializeKalmanChart() {
        const ctx = document.getElementById("animatedTrackerDemo").getContext("2d");

        // Generate more sophisticated tracking data
        const timePoints = Array.from({ length: 100 }, (_, i) => i);
        const actualPosition = timePoints.map(
          (t) => Math.sin(t * 0.15) * 25 + Math.cos(t * 0.08) * 15 + Math.sin(t * 0.25) * 10 + 50
        );
        const noisyMeasurements = actualPosition.map((pos) => pos + (Math.random() - 0.5) * 18);
        const kalmanFiltered = [];

        // Enhanced Kalman filter simulation
        let estimate = noisyMeasurements[0];
        let errorEstimate = 15;
        const processNoise = 0.1;
        const measurementNoise = 8;

        noisyMeasurements.forEach((measurement) => {
          // Prediction step
          const predictedEstimate = estimate;
          const predictedError = errorEstimate + processNoise;

          // Update step
          const kalmanGain = predictedError / (predictedError + measurementNoise);
          estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
          errorEstimate = (1 - kalmanGain) * predictedError;

          kalmanFiltered.push(estimate);
        });

        new Chart(ctx, {
          type: "line",
          data: {
            labels: timePoints,
            datasets: [
              {
                label: "Actual Ball Position",
                data: actualPosition,
                borderColor: "#00F5D4",
                backgroundColor: "rgba(0, 245, 212, 0.1)",
                borderWidth: 4,
                pointRadius: 0,
                tension: 0.4,
              },
              {
                label: "Noisy Sensor Data",
                data: noisyMeasurements,
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                borderWidth: 1,
                pointRadius: 1,
                tension: 0,
              },
              {
                label: "Kalman Filtered",
                data: kalmanFiltered,
                borderColor: "#4ade80",
                backgroundColor: "rgba(74, 222, 128, 0.1)",
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.3,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: "index",
            },
            plugins: {
              legend: {
                labels: {
                  color: "#c9d1d9",
                  font: { size: 14 },
                },
              },
              tooltip: {
                backgroundColor: "rgba(22, 27, 34, 0.9)",
                borderColor: "#00F5D4",
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Time (frames)",
                  color: "#c9d1d9",
                },
                ticks: { color: "#8b949e" },
                grid: { color: "rgba(139, 148, 158, 0.1)" },
              },
              y: {
                title: {
                  display: true,
                  text: "Position (mm)",
                  color: "#c9d1d9",
                },
                ticks: { color: "#8b949e" },
                grid: { color: "rgba(139, 148, 158, 0.1)" },
              },
            },
          },
        });
      }

export function initializePersonaHeatmap() {
        const ctx = document.getElementById("personaHeatmap").getContext("2d");

        const data = {
          labels: ["Aggressive", "Defensive", "Strategic", "Power", "Finesse", "Consistent"],
          datasets: [
            {
              label: "Player Intensity",
              data: [85, 45, 92, 70, 65, 95],
              backgroundColor: [
                "rgba(239, 68, 68, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(168, 85, 247, 0.8)",
                "rgba(245, 158, 11, 0.8)",
                "rgba(34, 197, 94, 0.8)",
                "rgba(0, 245, 212, 0.8)",
              ],
              borderColor: ["#ef4444", "#3b82f6", "#a855f7", "#f59e0b", "#22c55e", "#00F5D4"],
              borderWidth: 3,
              pointBackgroundColor: [
                "#ef4444",
                "#3b82f6",
                "#a855f7",
                "#f59e0b",
                "#22c55e",
                "#00F5D4",
              ],
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        };

        new Chart(ctx, {
          type: "radar",
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  color: "#8b949e",
                  backdropColor: "transparent",
                  font: { size: 12 },
                },
                grid: {
                  color: "rgba(139, 148, 158, 0.2)",
                  lineWidth: 1,
                },
                angleLines: {
                  color: "rgba(139, 148, 158, 0.2)",
                },
                pointLabels: {
                  color: "#c9d1d9",
                  font: { size: 16, weight: "bold" },
                },
              },
            },
          },
        });
      }

export function initializeEmotionalTrajectory() {
        const ctx = document.getElementById("emotionalTrajectoryChart").getContext("2d");

        // Enhanced emotional trajectory data
        const timeLabels = ["Start", "15min", "30min", "45min", "60min", "75min", "90min", "End"];
        const emotionalData = [7.2, 6.8, 8.1, 5.3, 6.7, 7.8, 8.5, 8.9];
        const stressLevels = [3.5, 4.2, 2.8, 7.1, 5.5, 3.9, 2.2, 1.8];

        new Chart(ctx, {
          type: "line",
          data: {
            labels: timeLabels,
            datasets: [
              {
                label: "Emotional State",
                data: emotionalData,
                borderColor: "#00F5D4",
                backgroundColor: "rgba(0, 245, 212, 0.1)",
                borderWidth: 4,
                pointBackgroundColor: "#00F5D4",
                pointBorderColor: "#fff",
                pointBorderWidth: 3,
                pointRadius: 8,
                tension: 0.4,
                fill: true,
              },
              {
                label: "Stress Level",
                data: stressLevels,
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderWidth: 3,
                pointBackgroundColor: "#f59e0b",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: "index",
            },
            plugins: {
              legend: {
                labels: {
                  color: "#c9d1d9",
                  font: { size: 14 },
                },
              },
              tooltip: {
                backgroundColor: "rgba(22, 27, 34, 0.9)",
                borderColor: "#00F5D4",
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Match Time",
                  color: "#c9d1d9",
                  font: { size: 14, weight: "bold" },
                },
                ticks: {
                  color: "#8b949e",
                  font: { size: 12 },
                },
                grid: { color: "rgba(139, 148, 158, 0.1)" },
              },
              y: {
                title: {
                  display: true,
                  text: "Score (1-10)",
                  color: "#c9d1d9",
                  font: { size: 14, weight: "bold" },
                },
                min: 0,
                max: 10,
                ticks: {
                  color: "#8b949e",
                  font: { size: 12 },
                },
                grid: { color: "rgba(139, 148, 158, 0.1)" },
              },
            },
          },
        });
      }
      // --- Invisible char sanitizer (safe, fast) ---
      const INVIS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g;
      function sanitizeInvisibles(s) {
        return INVIS_RE.test(s) ? s.replace(INVIS_RE, "") : s;
      }

      // --- Grapheme-safe truncation (avoids cutting emojis) ---
      function truncateGraphemes(str, n) {
        const s = String(str);
        if (window.Intl?.Segmenter) {
          const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
          let out = "", i = 0;
          for (const g of seg.segment(s)) { if (i++ >= n) break; out += g.segment; }
          return out;
        }
        return s.slice(0, n);
      }

      // --- A11Y-friendly cue <li> builder ---
      function renderCue(cue) {
        const li = document.createElement("li");
        li.className = "cue-item text-xs";

        const pass = Number(cue?.audit_score ?? 0) > 0.8;

        const status = document.createElement("span");
        status.className = "mp-status";
        status.setAttribute("aria-hidden", "true");
        status.textContent = pass ? "✓" : "";

        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = pass ? "Pass" : "No status";

        const score = Number(cue?.audit_score ?? 0).toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const ts = new Date(cue?.timestamp ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const cat = cue?.cue_category ?? "—";
        const cleanCue = sanitizeInvisibles(String(cue?.original_cue ?? ""));
        const cuePreview = truncateGraphemes(cleanCue, 20);

        const text = document.createTextNode(
          ` ${ts}: [${cat}] "${cuePreview}..." (${score})${cue?.rewrite_details?.reason ? " -> Rewritten" : ""}`
        );

        li.append(status, sr, text);
        return li;
      }

      // --- Efficient list replace ---
      function renderCueList(cues, ul) {
        if (!ul) return;
        const frag = document.createDocumentFragment();
        (cues ?? []).forEach(c => frag.appendChild(renderCue(c)));
        ul.replaceChildren(frag);
      }

      // --- Optional: dev-only DOM scrubber (don’t run in prod) ---
      function scrubInvisibleChars(root = document.body) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const cleaned = sanitizeInvisibles(node.nodeValue || "");
          if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
        }
      }

      export function updateHistoryPanel(data) {
        if (!data || !data.recent_cues) return;
        lastHistoryData = data;
        const historyPanel = document.getElementById('cue-history-manager-panel');
        if (!historyPanel) return;

        // static shell with an empty UL we control
        historyPanel.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-bold text-green-300 mb-2">🕒 Cue Timeline</h4>
              <ul id="cue-history-list" class="cue-list space-y-2 h-48 overflow-y-auto"></ul>
            </div>
            <div class="space-y-4">
              <div>
                <h4 class="font-bold text-green-300 mb-2">🔁 Rewrite Frequency</h4>
                <p class="text-2xl font-bold text-white">${(data.rewrite_stats.rate * 100).toFixed(0)}%</p>
                <p class="text-xs text-slate-400">${data.rewrite_stats.rewritten} of ${data.rewrite_stats.total} cues rewritten</p>
              </div>
              <div>
                <h4 class="font-bold text-green-300 mb-2">📝 Session Summary</h4>
                <p class="text-xs italic text-slate-300">"${data.latest_summary ? data.latest_summary.summary : 'No summary yet.'}"</p>
              </div>
            </div>
          </div>`;

        // render cues with the safe builder
        const ul = document.getElementById('cue-history-list');
        renderCueList(data.recent_cues, ul);

        // keep your library update as-is (or make it similar)
        const libraryList = document.getElementById('cue-library-list');
        if (libraryList && data.composed_cues && data.composed_cues.length > 0) {
          libraryList.innerHTML = data.composed_cues
            .map(c => `<li class="text-xs italic">"${sanitizeInvisibles(c.generated_cue_text)}"</li>`)
            .join('');
        }
      }

export function updateDriftChart(driftData) {
        if (!driftChart || !driftData) return;
        const labels = Array.from({ length: driftData.length }, (_, i) => i + 1);
        let cumulativeConfidence = 0,
          cumulativeComposure = 0;
        const confidenceTrend = driftData.map(
          (d) => (cumulativeConfidence += d.confidence_change || 0)
        );
        const composureTrend = driftData.map(
          (d) => (cumulativeComposure += d.composure_change || 0)
        );
        // If the trend is visually flat, add a subtle demo wobble so movement is perceptible
        const flat = (arr) => arr.every((v) => Math.abs(v - arr[0]) < 1e-6);
        if (driftData.length > 0 && flat(confidenceTrend) && flat(composureTrend)) {
          for (let i = 0; i < driftData.length; i++) {
            const t = i / Math.max(1, driftData.length - 1);
            const wobble = Math.sin(t * Math.PI * 2) * 0.02 + (Math.random() - 0.5) * 0.01;
            confidenceTrend[i] += wobble;
            composureTrend[i] += -wobble * 0.8;
          }
        }
        driftChart.data.labels = labels;
        driftChart.data.datasets[0].data = confidenceTrend;
        driftChart.data.datasets[1].data = composureTrend;
        driftChart.update();
      }

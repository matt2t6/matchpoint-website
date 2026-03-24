import React, { useEffect, useRef, useState } from 'react'

export default function LazyLineChart() {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let chart
    let cancelled = false

    async function init() {
      // Dynamically import Chart.js only when needed
      const { default: Chart } = await import('chart.js/auto')

      if (cancelled) return

      const ctx = canvasRef.current.getContext('2d')
      const labels = Array.from({ length: 30 }, (_, i) => i + 1)
      const data = labels.map(() => 50 + (Math.random() - 0.5) * 20)

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Demo Metric',
              data,
              borderColor: '#00F5D4',
              backgroundColor: 'rgba(0, 245, 212, 0.1)',
              borderWidth: 3,
              tension: 0.3,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#c9d1d9' } } },
          scales: {
            x: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(139,148,158,0.1)' } },
            y: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(139,148,158,0.1)' } },
          },
        },
      })

      setReady(true)
    }

    init()
    return () => {
      cancelled = true
      if (chart) chart.destroy()
    }
  }, [])

  return (
    <div style={{ height: 260 }}>
      <canvas ref={canvasRef} aria-label="Demo line chart" role="img" />
      {!ready && (
        <div style={{ color: '#8b949e', paddingTop: 8, fontSize: 12 }}>Loading chart…</div>
      )}
    </div>
  )
}


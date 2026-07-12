---

# MatchPoint Systems — Reference Architecture
**Document 1 of 6 | Version 1.0 | July 2026**
**Status: Draft**

---

## Architectural Principles

These principles govern every design decision in the MatchPoint
platform. When a new feature, subsystem, or integration is proposed,
it must not violate these principles.

1. Time is the primary abstraction.
   Every event, measurement, and state has a timestamp_ns.
   Frame numbers, sequence counters, and wall clocks are
   implementation details. Time is not.

2. Physics is authoritative.
   The system models reality, not approximations of reality.
   When physics and convenience conflict, physics wins.

3. MatchFlow is the single source of truth.
   No subsystem owns state independently of MatchFlow.
   All state flows through it. Nothing bypasses it.

4. Rendering consumes state. It never owns it.
   The Visual Runtime displays what MatchFlow says is true.
   It does not decide what is true.

5. Live officiating has exactly one authoritative timeline.
   Branching, simulation, and experimentation are research
   tools. They never touch the live officiating path.

6. Simulation exists to replace assumptions with evidence.
   Every hardware choice, algorithm parameter, and
   architectural decision should be validated by the
   simulator before reaching a live court.

7. Every subsystem must be replayable.
   If a subsystem cannot reproduce its output from a
   recorded MatchState sequence, it is not correctly built.

8. Hardware is hidden behind abstractions.
   Whether data comes from simulation or 10x522 FPS cameras
   is irrelevant to every layer above the HAL.

9. Coupling decreases as the system matures.
   New additions should clarify responsibilities,
   not entangle them.

---

## The Five Layers

### Layer 1 — Research Layer
Responsibility: Produce ground truth, evidence, and reports.

Subsystems:
- Simulation Framework
- Timeline Service
- Branch Manager
- Experiment Engine
- Validation Framework
- Metrics Engine

Produces:  MatchState snapshots, experiment reports, validation data
Consumes:  Nothing from layers below
Rule:      Never depends on Runtime, Visual Runtime, or Presentation

### Layer 2 — Runtime Layer
Responsibility: Own the single authoritative MatchState stream.

Subsystems:
- MatchFlow Director
- Vision Pipeline
- Sensor Fusion
- Physics Engine
- UKF Tracking
- Officiating Engine

Produces:  Authoritative MatchState stream
Consumes:  HAL measurement stream
Rule:      Unaware that Visual Runtime or Presentation exist

### Layer 3 — Hardware Abstraction Layer (HAL)
Responsibility: Hide all hardware behind a common interface.

Subsystems:
- Camera Node Interface
- Synchronization Protocol
- Simulator Interface (identical contract to live cameras)
- Degraded Mode Handler
- Confidence Model

Produces:  Measurement{ timestamp_ns, sensor_id, covariance, confidence, pose }
Consumes:  Raw sensor data OR simulation output
Rule:      Simulation and live cameras are indistinguishable above this layer

### Layer 4 — Visual Runtime
Responsibility: Display physical reality at any requested timestamp.

Subsystems:
- Animation Clock
- Physics Interpolator
- Court Renderer
- Trajectory Layer
- Heatmap Layer (Live Trail / Session Density / Confidence Layer)
- Camera Overlay
- Confidence Overlay
- Replay Controller

Produces:  Pixels at timestamp t
Consumes:  MatchState at timestamp t
Owns:      Canvas, animation loop
Rule:      Never owns application state. Never imports React.
           render(timestamp: number) is the only public entry point.

### Layer 5 — Presentation Layer
Responsibility: User interaction and application shell.

Subsystems:
- AEGIS Dashboard
- Phoenix Pro Investor Demo
- Officiating UI
- Coaching UI
- Mobile Client
- Broadcast Output

Produces:  User interaction events
Consumes:  Visual Runtime output + MatchState for metric cards
Owns:      UI state, routing, forms, navigation
Rule:      Never owns physical state. Never drives canvas animation.

---

## Dependency Rules

### Allowed
- Research      →  Runtime         reads MatchState snapshots
- Runtime       →  HAL             reads measurement stream
- Visual Runtime → Runtime         reads MatchState at timestamp t
- Presentation  →  Visual Runtime  reads render output
- Presentation  →  Runtime         reads MatchState for metric cards

### Never Allowed
- Runtime        →  Research        runtime is unaware of experiments
- Runtime        →  Visual Runtime  runtime does not know UI exists
- Visual Runtime →  Presentation    renderer does not know React exists
- HAL            →  any layer above HAL
- Live officiating path  →  Branch Manager

---

## Communication Patterns

| From            | To              | Pattern | Protocol          |
|-----------------|-----------------|---------|-------------------|
| HAL             | Runtime         | Push    | Internal stream   |
| Runtime         | Presentation    | Push    | SSE               |
| Runtime         | Visual Runtime  | Pull    | Query by timestamp|
| Timeline Service| Visual Runtime  | Pull    | Query by t range  |
| Branch Manager  | Experiment Engine| Push   | Isolated channel  |
| Presentation    | Runtime         | Pull    | REST / fetch      |

---

## Current Implementation Status

| Layer            | Status   | Primary Files                          |
|------------------|----------|----------------------------------------|
| Research         | Partial  | ao2022_frames.js (2101 recorded frames)|
| Runtime          | Partial  | aegis_sse_bridge.py                    |
|                  |          | ao2022_match_panel.js                  |
| HAL              | Proto    | ao2022_frames.js as simulator proxy    |
| Visual Runtime   | Proto    | ao2022_match_panel.js (canvas + tick)  |
| Presentation     | Active   | index.html, app-9.js, metricsEngine.js |

---

## Remaining Documents

| Doc | Title                              | Status  |
|-----|------------------------------------|---------|
| 1   | Reference Architecture (this file) | Draft   |
| 2   | MatchFlow Specification            | Pending |
| 3   | Visual Runtime Specification       | Pending |
| 4   | Hardware Abstraction Layer Spec    | Pending |
| 5   | Research Platform Specification    | Pending |
| 6   | Engineering Principles             | Pending |

---

_This document is the architectural constitution of MatchPoint Systems.
Every subsystem, feature, and integration must fit within this structure.
When in doubt, return to the nine principles above._

---

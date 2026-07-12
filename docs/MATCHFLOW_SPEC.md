---

# MatchPoint Systems — MatchFlow Specification
**Document 2 of 6 | Version 1.0 | July 2026**
**Status: Draft**

---

## Purpose

MatchFlow is the single source of truth for all physical state
in the MatchPoint platform. Every subsystem either produces
MatchState or consumes it. Nothing bypasses MatchFlow.

This document defines:
- The MatchState schema
- The event envelope
- Producer responsibilities
- Consumer contract
- Immutability guarantees
- Timestamp semantics

---

## Core Principle

MatchFlow does not transform data.
It does not filter data.
It does not interpret data.
It receives physical state from the Runtime Layer
and makes it available to all consumers unchanged.

One producer. Many consumers. Immutable snapshots.

---

## The MatchEvent Envelope

Every piece of data in the MatchPoint platform
is wrapped in a MatchEvent envelope.

```typescript
interface MatchEvent {
  // Primary time abstraction — nanoseconds since session start
  timestamp_ns:   bigint

  // Monotonically increasing counter for ordering within same ns
  sequence_id:    number

  // Where this state originated
  source:         'live' | 'replay' | 'simulation' | 'test'

  // System-wide confidence in this snapshot (0.0 - 1.0)
  confidence:     number

  // The complete physical state at this moment
  payload:        MatchState
}
```

---

## The MatchState Schema

MatchState is an immutable snapshot of the complete
physical world at one instant in time.

```typescript
interface MatchState {

  // ── Identity ──────────────────────────────────────────
  timestamp_ns:     bigint      // nanoseconds since session start
  sequence_id:      number      // monotonic ordering counter
  session_id:       string      // unique match/session identifier
  court_id:         string      // court identifier

  // ── Ball Physics ──────────────────────────────────────
  ball: {
    // Position in normalized court coordinates (0.0 - 1.0)
    x:              number      // longitudinal (baseline to baseline)
    y:              number      // lateral (sideline to sideline)
    z:              number      // height above court surface (meters)

    // Velocity vector (meters per second)
    vx:             number
    vy:             number
    vz:             number

    // Spin state (radians per second)
    spin_rpm:       number
    spin_axis_x:    number
    spin_axis_y:    number
    spin_axis_z:    number

    // Derived
    speed_ms:       number      // magnitude of velocity vector
    speed_mph:      number      // converted for display

    // Tracking quality
    confidence:     number      // 0.0 - 1.0
    visible_cameras: number     // how many cameras have lock
  }

  // ── Vision Pipeline ───────────────────────────────────
  vision: {
    frame_index:    number
    cameras_active: number
    cameras_total:  number
    sync_delta_ns:  bigint      // max timestamp spread across cameras
    occlusion:      boolean
    occlusion_duration_ms: number
  }

  // ── Sensor Fusion ─────────────────────────────────────
  fusion: {
    algorithm:      'UKF' | 'EKF' | 'particle' | 'hybrid'
    innovation:     number      // UKF innovation score
    covariance_trace: number    // trace of covariance matrix
    filter_state:   'converged' | 'diverging' | 'reset' | 'init'
  }

  // ── Trajectory ────────────────────────────────────────
  trajectory: {
    phase:          'serve' | 'flight' | 'bounce' | 'dead'
    bounce_count:   number
    predicted_landing: {
      x:            number
      y:            number
      confidence:   number
    }
    arc_peak: {
      x:            number
      z:            number
    }
  }

  // ── Officiating ───────────────────────────────────────
  officiating: {
    last_call: {
      call:         'IN' | 'OUT' | 'FAULT' | 'LET' | 'PENDING' | 'NONE'
      confidence:   number
      timestamp_ns: bigint
      line:         string      // which line triggered the call
      margin_mm:    number      // distance from line in millimeters
    }
    challenge_available: boolean
    review_active:  boolean
  }

  // ── Match Score ───────────────────────────────────────
  score: {
    server:         'A' | 'B'
    set:            number
    game_a:         number
    game_b:         number
    point_a:        number      // 0=0 1=15 2=30 3=40 4=game
    point_b:        number
    sets_a:         number
    sets_b:         number
    tiebreak:       boolean
    match_point:    boolean
  }

  // ── Players ───────────────────────────────────────────
  players: {
    server: {
      id:           string
      position_x:   number
      position_y:   number
      stance:       string
    }
    returner: {
      id:           string
      position_x:   number
      position_y:   number
      stance:       string
    }
  }

  // ── Coaching Analytics ────────────────────────────────
  coaching: {
    serve_speed_mph:    number
    max_serve_mph:      number
    rally_count:        number
    rally_avg:          number
    rally_longest:      number
    reaction_time_s:    number
    court_coverage_pct: number
    shot_accuracy_pct:  number
  }

  // ── Environmental ─────────────────────────────────────
  environment: {
    wind_speed_ms:  number
    wind_direction: number      // degrees
    temperature_c:  number
    humidity_pct:   number
    lighting_lux:   number
    surface:        'hard' | 'clay' | 'grass' | 'carpet'
  }

  // ── Diagnostics ───────────────────────────────────────
  diagnostics: {
    pipeline_latency_ms:  number
    fusion_latency_ms:    number
    render_latency_ms:    number
    dropped_frames:       number
    system_confidence:    number   // 0.0 - 1.0 overall system health
  }
}
```

---

## Immutability Contract

MatchState snapshots are immutable once published.

Rules:
- No consumer may modify a MatchState snapshot
- No subsystem may mutate a published snapshot in place
- Updates always produce a new snapshot with a new timestamp_ns
- The previous snapshot remains valid and accessible

This enables:
- Deterministic replay
- Parallel branch comparison
- Regression testing
- Debugging at any historical timestamp

---

## Timestamp Semantics

timestamp_ns is the primary ordering key for all events.

Rules:
- timestamp_ns is nanoseconds elapsed since session start
- session start is defined as the moment the match clock begins
- All subsystems synchronize to this clock
- The Timeline Service is the authoritative clock source
- Wall clock time is an implementation detail, not an abstraction

In live mode:    timestamp_ns = hardware_sync_clock - session_start
In replay mode:  timestamp_ns = recorded value from original session
In simulation:   timestamp_ns = simulation_clock.now()

All three modes are indistinguishable to consumers.

---

## Producer Responsibilities

Only the Runtime Layer produces MatchState.
All other layers are consumers.

The Runtime Layer must:
- Publish a new snapshot on every meaningful state change
- Never publish two snapshots with identical timestamp_ns
- Never mutate a previously published snapshot
- Include all fields — partial snapshots are not valid
- Set confidence accurately — overconfident systems fail silently

---

## Consumer Contract

Consumers of MatchState must:
- Treat every snapshot as immutable
- Never modify a snapshot
- Request state by timestamp range, not by index
- Handle gaps in the timeline gracefully
- Not assume a fixed update rate

The Visual Runtime asks:
  "What is the MatchState at t = 15.233417s?"

The Timeline Service answers with the most recent
snapshot at or before that timestamp.

---

## What MatchFlow Does Not Do

MatchFlow does not:
- Filter or transform state
- Make officiating decisions
- Drive UI updates directly
- Own the animation loop
- Know that React exists
- Know that the Visual Runtime exists

MatchFlow is a pipe, not a processor.

---

## Current Implementation Mapping

| MatchState Field     | Current Source                        |
|----------------------|---------------------------------------|
| ball.x / y / z       | ao2022_frames.js AO2022_FRAMES array  |
| ball.speed_mph       | frame.spd                             |
| ball.spin_rpm        | frame.rpm                             |
| officiating.last_call| frame.call                            |
| coaching.*           | ao2022_match_panel.js updateMetrics() |
| environment.*        | aegis_sse_bridge.py /api/environmental|
| diagnostics.*        | aegis_sse_bridge.py /metrics          |

---

## Gap Between Spec and Current Implementation

This document defines the target schema.
The current implementation covers approximately 40% of it.

Priority fields for next implementation phase:
1. ball.x / y / z / vx / vy / vz    (exists in frames, needs extraction)
2. officiating.last_call             (exists, needs null safety)
3. coaching.*                        (exists, needs deterministic source)
4. trajectory.phase                  (partially exists)
5. score.*                           (partially exists)

---

## Remaining Documents

| Doc | Title                              | Status  |
|-----|------------------------------------|---------|
| 1   | Reference Architecture             | Draft   |
| 2   | MatchFlow Specification (this file)| Draft   |
| 3   | Visual Runtime Specification       | Pending |
| 4   | Hardware Abstraction Layer Spec    | Pending |
| 5   | Research Platform Specification    | Pending |
| 6   | Engineering Principles             | Pending |

---

_MatchState is reality. Everything else is a view of reality._

---

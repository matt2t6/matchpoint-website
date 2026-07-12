---

# MatchPoint Systems — Visual Runtime Specification
**Document 3 of 6 | Version 1.0 | July 2026**
**Status: Draft**

---

## Purpose

The Visual Runtime is responsible for one thing:
displaying physical reality at any requested timestamp.

It is not a dashboard.
It is not a React component.
It is not a data store.

It is a deterministic visual machine that accepts a timestamp
and renders the world that existed at that moment.

---

## Core Principle

render(timestamp: number): void

That is the entire public API of the Visual Runtime.
Everything else is an implementation detail.

---

## What The Visual Runtime Owns

- Canvas element(s)
- Animation loop (single requestAnimationFrame)
- Physics interpolation between measurements
- All court, ball, trajectory, and overlay rendering
- Replay playback and scrubbing

## What The Visual Runtime Does Not Own

- Application state
- React component lifecycle
- MatchState production
- Officiating decisions
- Score computation
- Metric card DOM elements
- Any element outside its canvas

---

## The Animation Clock

The Animation Clock is the heartbeat of the Visual Runtime.
Everything derives from it.

```typescript
interface AnimationClock {
  // Subscribe to receive frameTime on every animation frame
  subscribe(callback: (frameTime: number) => void): () => void

  // Unsubscribe all callbacks and stop the loop
  destroy(): void

  // Current playback rate (1.0 = realtime, 0.5 = half speed)
  rate: number

  // Current timestamp in seconds since session start
  now(): number
}
```

Rules:
- Exactly one AnimationClock exists per Visual Runtime instance
- All renderable layers subscribe to this clock
- No layer creates its own requestAnimationFrame loop
- frameTime is seconds since session start, not wall clock time
- The clock rate can be changed for replay and slow motion

---

## The Physics Interpolator

Between telemetry measurements, the ball position is
predicted using physical equations, not easing curves.

```typescript
interface PhysicalState {
  x:   number    // normalized court coordinates
  y:   number
  z:   number    // meters above surface
  vx:  number    // meters per second
  vy:  number
  vz:  number
}

interface Interpolator {
  // Update with a new measurement from MatchFlow
  update(state: PhysicalState, timestamp_s: number): void

  // Predict position at any future or current timestamp
  stateAt(timestamp_s: number): PhysicalState
}
```

Physics model:
x(t) = x0 + vx * dt
y(t) = y0 + vy * dt
z(t) = z0 + vz * dt - 0.5 * g * dt^2

Where:
dt = timestamp_s - last_measurement_timestamp_s
g = 9.81 m/s^2

Future enhancements (when available from UKF):
drag coefficient
Magnus force from spin state
wind vector from environmental state

text

The interpolator is a physics predictor, not an animator.
It shows where the ball physically should be,
not where it looks good to be.

---

## Rendering Layers

Each layer is independent.
Each layer receives frameTime from the AnimationClock.
Layers render in order from back to front.

### Layer 1 — Court Renderer

Responsibility: Static court geometry
Updates:        Once on init, again if court surface changes
Inputs:         court_id, surface type
Owns:           Background canvas or bottom layer

Court lines, service boxes, baselines, net.
Perspective transform from court coordinates to canvas pixels.
Surface color varies by court type (hard/clay/grass).

### Layer 2 — Trajectory Layer

Responsibility: Ball position and motion trail
Updates:        Every animation frame
Inputs:         Interpolator.stateAt(frameTime)
Owns:           Ball rendering, trail rendering

Three sub-components:

**Live Trail**
- Last 1.5 seconds of ball positions
- Each position has: x, y, z, age, opacity
- Every frame: opacity *= 0.985, radius += 0.01
- Positions older than 1.5s are removed
- Renders as fading ribbon, not dots

**Predicted Path**
- Forward projection from current state using Interpolator
- Shown as dashed line to predicted landing zone
- Updates only when a new measurement arrives
- Confidence drives opacity (low confidence = faint line)

**Ball**
- Rendered at Interpolator.stateAt(frameTime)
- Size scales with z height (perspective)
- Shadow rendered on court surface at (x, y, z=0)

### Layer 3 — Heatmap Layer

Responsibility: Session landing zone density
Updates:        On bounce events only, not every frame
Inputs:         Bounce events from MatchFlow
Owns:           Density accumulation, kernel rendering

Two sub-components:

**Session Density Map**
- Accumulates all bounce positions for the session
- Rendered as Gaussian kernel density estimate
- Updates only on new bounce event
- Color scale: cool (rare) to hot (frequent)

**Confidence Layer**
- Court surface tint based on tracking quality
- Green:  system_confidence > 0.90
- Yellow: system_confidence 0.70 to 0.90
- Red:    system_confidence < 0.70
- Updates when diagnostics.system_confidence changes

### Layer 4 — Confidence Overlay

Responsibility: Per-call confidence visualization
Updates:        On officiating events
Inputs:         officiating.last_call from MatchState
Owns:           Call flash, confidence halo around ball

On each call event:
- Flash the relevant line (IN = cyan, OUT = red)
- Render confidence halo around ball landing position
- Halo radius inversely proportional to confidence
- Halo fades over 2 seconds

### Layer 5 — Camera Overlay (Diagnostic Mode)

Responsibility: Camera frustum visualization
Updates:        On camera state change
Inputs:         vision.cameras_active, camera pose data
Owns:           Frustum wireframes, camera status indicators

Visible only in diagnostic mode.
Shows which cameras are active and their coverage areas.
Color codes camera health (green/yellow/red).

---

## The Replay Controller

```typescript
interface ReplayController {
  seek(timestamp_s: number): void
  play(): void
  pause(): void
  setRate(rate: number): void

  readonly isPlaying:   boolean
  readonly currentTime: number
  readonly duration:    number
  readonly rate:        number
}
```

The Replay Controller moves the AnimationClock timestamp.
All rendering layers respond automatically.
No layer has special replay logic.
Live mode, replay mode, and simulation are identical
to every rendering layer.

---

## Performance Targets
Target frame rate: Determined by display hardware
60Hz, 144Hz, 30Hz all supported
Target latency: less than 16ms from MatchState to pixel
Physics prediction: Up to 100ms ahead of last measurement
Heatmap update: less than 5ms per bounce event
Trail decay: Computed per frame, no accumulation cost
Canvas resolution: Device pixel ratio aware

text

---

## Coordinate System
Court coordinates (normalized):
x: 0.0 = near baseline 1.0 = far baseline
y: 0.0 = left sideline 1.0 = right sideline
z: 0.0 = court surface positive = above surface in meters

Canvas coordinates:
Derived from court coordinates via perspective transform
dataToCanvas(x, y) returns cx, cy in canvas pixels
z affects cy (higher z = higher on canvas) and scale

text

---

## Current Implementation Mapping

| Spec Component        | Current File                | Status   |
|-----------------------|-----------------------------|----------|
| Animation Clock       | ao2022_match_panel.js tick()| Proto    |
| Physics Interpolator  | ao2022_match_panel.js tween | Partial  |
| Court Renderer        | ao2022_match_panel.js       | Working  |
| Trajectory Layer      | ao2022_match_panel.js       | Working  |
| Live Trail            | ao2022_match_panel.js       | Working  |
| Heatmap Layer         | ao2022_match_panel.js       | Proto    |
| Confidence Overlay    | ao2022_match_panel.js       | Proto    |
| Camera Overlay        | Not yet implemented         | Pending  |
| Replay Controller     | ao2022_match_panel.js       | Partial  |

The current ao2022_match_panel.js is the prototype of the
Visual Runtime. The next phase extracts and formalizes it
into a proper matchpoint-renderer.js module.

---

## Migration Path

Phase 1 (current):
  ao2022_match_panel.js acts as monolithic proto-renderer

Phase 2 (next):
  Extract AnimationClock into matchpoint-renderer.js
  Extract Interpolator into matchpoint-interpolator.js
  ao2022_match_panel.js becomes a thin data adapter

Phase 3 (Visual Runtime complete):
  Full layer separation
  ReplayController formalized
  Camera overlay implemented
  ao2022_match_panel.js retired

---

## Remaining Documents

| Doc | Title                              | Status  |
|-----|------------------------------------|---------|
| 1   | Reference Architecture             | Draft   |
| 2   | MatchFlow Specification            | Draft   |
| 3   | Visual Runtime Spec (this file)    | Draft   |
| 4   | Hardware Abstraction Layer Spec    | Pending |
| 5   | Research Platform Specification    | Pending |
| 6   | Engineering Principles             | Pending |

---

_The renderer asks one question: what does the world
look like at timestamp t? Everything else follows._

---

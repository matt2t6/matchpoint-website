---

# MatchPoint Systems — Hardware Abstraction Layer Specification
**Document 4 of 6 | Version 1.0 | July 2026**
**Status: Draft**

---

## Purpose

The Hardware Abstraction Layer (HAL) hides all physical
hardware behind a single common interface.

Whether data originates from:
- 10 x 522 FPS production cameras
- A laptop running the simulation framework
- A degraded 6-camera configuration in rain
- A recorded replay from a previous match

...is completely irrelevant to every layer above the HAL.

The HAL makes simulation and live hardware indistinguishable.

---

## Core Principle

Every data source presents exactly one interface:

```typescript
interface Measurement {
  timestamp_ns:  bigint    // nanoseconds since session start
  sensor_id:     string    // unique identifier for this source
  covariance:    number[]  // 3x3 flattened position uncertainty
  confidence:    number    // 0.0 - 1.0 measurement quality
  pose: {
    x:           number    // normalized court coordinates
    y:           number
    z:           number    // meters above surface
    vx:          number    // velocity m/s (if available)
    vy:          number
    vz:          number
  }
}
```

If a data source cannot provide this interface,
it does not belong above the HAL.

---

## Target Hardware Architecture

### Production Configuration
10 x Basler ace2 cameras
Resolution: 522 FPS capable
Placement: Perimeter court mounting
Sync: Hardware trigger, sub-millisecond
Interface: GigE Vision / USB3 Vision
Processing: Per-camera Jetson Orin node

10 x NVIDIA Jetson Orin nodes
Role: Per-camera vision processing
Output: Measurement stream to MatchFlow
Sync: PTP (Precision Time Protocol)
Fallback: Graceful degradation if node fails

1 x Central Jetson Xavier
Role: MatchFlow Director
Input: Measurement streams from all Orin nodes
Output: Authoritative MatchState stream
Redundancy: Hot standby capable

text

### Minimum Viable Configuration
6 x cameras (degraded court coverage)
Confidence automatically reduced
Larger prediction uncertainty
System remains operational
Officiating confidence threshold enforced

text

---

## Camera Node Interface

Each Jetson Orin node exposes this interface to MatchFlow:

```typescript
interface CameraNode {
  // Unique identifier (e.g. "cam_north_baseline_left")
  sensor_id:      string

  // Physical position and orientation of camera
  mount_pose: {
    position_x:   number    // meters from court center
    position_y:   number
    position_z:   number    // height above ground
    pan_deg:      number    // horizontal angle
    tilt_deg:     number    // vertical angle
    roll_deg:     number
  }

  // Intrinsic camera parameters
  intrinsics: {
    focal_length_px:  number
    cx:               number    // principal point
    cy:               number
    distortion:       number[]  // lens distortion coefficients
  }

  // Current operational status
  status: 'active' | 'degraded' | 'offline' | 'calibrating'

  // Stream of measurements (called at camera frame rate)
  onMeasurement(callback: (m: Measurement) => void): void
}
```

---

## Synchronization Protocol

All cameras must agree on timestamp_ns before
measurements reach MatchFlow.
Protocol: PTP (IEEE 1588 Precision Time Protocol)
Target sync accuracy: < 100 microseconds across all nodes
Sync master: Central Jetson Xavier
Fallback: Software NTP if hardware PTP unavailable

On each frame:
camera_timestamp = local_hardware_clock
sync_offset = ptp_master_offset
timestamp_ns = (camera_timestamp - sync_offset
- session_start_ns)

Session start is defined as:
The nanosecond the match clock begins.
All cameras synchronize to this epoch.

text

---

## Simulator Interface

The simulation framework presents an identical interface
to the HAL as live cameras.

```typescript
interface SimulatorNode extends CameraNode {
  // Simulator-specific controls (not exposed above HAL)
  _setSeed(seed: number): void
  _setNoiseModel(model: NoiseModel): void
  _injectFailure(type: FailureType): void
  _reset(): void
}
```

From MatchFlow's perspective, SimulatorNode and CameraNode
are identical. MatchFlow never knows which it is receiving.

This is enforced by the HAL boundary:
- Simulator controls (_prefixed) never cross the HAL
- MatchFlow receives only the Measurement interface
- The source field in MatchEvent carries 'simulation'
  for auditing, but does not change processing logic

---

## Degraded Mode

The system must remain operational when cameras fail.
Degraded mode triggers when:
cameras_active < cameras_total

Behavior:
Confidence automatically scaled:
confidence = (cameras_active / cameras_total) * base_confidence

Prediction uncertainty increases:
covariance scaled by degradation factor

Officiating threshold enforced:
If system_confidence < 0.85:
calls flagged for human review
challenge protocol activated automatically

No silent failure:
Confidence Layer (Visual Runtime) shows yellow/red
Diagnostic overlay activates automatically
Tournament officials notified via officiating UI

text

---

## Confidence Model

System confidence is computed from multiple sources:
Per-camera confidence:
Detection quality (0.0 - 1.0)
Based on: lighting, occlusion, calibration drift

System confidence:
Weighted average of active camera confidences
Weighted by camera coverage of current ball position
Cameras with better view of ball weighted higher

Temporal confidence:
Degrades if last measurement > 50ms old
Fully degraded if > 200ms since last measurement
Triggers filter reset in UKF

Final confidence published in:
MatchState.diagnostics.system_confidence
MatchState.ball.confidence
MatchState.vision.cameras_active

text

---

## Calibration

Camera calibration is a HAL responsibility.
MatchFlow never receives raw pixel coordinates.
Calibration types:
Intrinsic: Focal length, principal point, distortion
Performed offline, stored per camera
Validated on startup

Extrinsic: Camera position and orientation
Performed with court calibration target
Validated against known court dimensions

Temporal: PTP sync offset per node
Validated continuously during operation

Calibration data storage:
Per camera, stored in calibration.json
Loaded at node startup
Version controlled with firmware

Recalibration triggers:
Camera physical disturbance detected
Sync delta exceeds 500 microseconds
Confidence below threshold for > 60 seconds
Manual trigger from officiating UI

text

---

## Current Implementation Status

| Component              | Status      | Notes                          |
|------------------------|-------------|--------------------------------|
| Simulator Interface    | Proto       | ao2022_frames.js as data proxy |
| Camera Node Interface  | Pending     | Hardware not yet procured      |
| PTP Synchronization    | Pending     | Requires physical hardware     |
| Degraded Mode Handler  | Partial     | Confidence model in bridge     |
| Calibration System     | Pending     | Designed, not implemented      |
| Jetson Orin nodes      | Pending     | Procurement phase              |
| Central Xavier         | Pending     | Procurement phase              |

Current simulator proxy (ao2022_frames.js):
- Provides x, y, z, spd, rpm, call per frame
- Does not yet provide vx, vy, vz explicitly
- Does not provide covariance or sensor_id
- Sufficient for Phase 1 demo and algorithm development

---

## Migration Path

Phase 1 (current):
  ao2022_frames.js serves as flat-file simulator
  No formal HAL boundary exists yet
  Sufficient for Visual Runtime and MatchFlow prototyping

Phase 2 (simulator formalization):
  Implement SimulatorNode interface formally
  Add vx, vy, vz to frame data
  Add covariance estimation from frame sequence
  HAL boundary becomes explicit in code

Phase 3 (hardware integration):
  Procure Jetson Orin nodes and cameras
  Implement CameraNode for each physical camera
  Implement PTP synchronization
  Simulator and live cameras become interchangeable

Phase 4 (production hardening):
  Degraded mode fully tested
  Calibration system operational
  Confidence model validated against ground truth
  ITF certification evidence generated

---

## Remaining Documents

| Doc | Title                              | Status  |
|-----|------------------------------------|---------|
| 1   | Reference Architecture             | Draft   |
| 2   | MatchFlow Specification            | Draft   |
| 3   | Visual Runtime Specification       | Draft   |
| 4   | Hardware Abstraction Layer (this)  | Draft   |
| 5   | Research Platform Specification    | Pending |
| 6   | Engineering Principles             | Pending |

---

_Simulation and live hardware are indistinguishable above
the HAL boundary. That is not a convenience — it is a
design requirement._

---

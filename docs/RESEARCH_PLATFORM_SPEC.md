---

# MatchPoint Systems — Research Platform Specification
**Document 5 of 6 | Version 1.0 | July 2026**
**Status: Draft**

---

## Purpose

The Research Platform enables systematic, scientific evaluation
of MatchPoint's hardware choices, algorithms, and architectural
decisions before they reach a live court.

It is the layer that replaces assumptions with evidence.

---

## Core Principle

Every major decision in MatchPoint should be answerable
with data, not opinion.

Instead of:
  "Ten cameras is probably enough."

The Research Platform produces:
  "Ten cameras achieves 99.97% line-call accuracy under
   these conditions. Eight cameras achieves 97.3%.
   The difference is statistically significant at p < 0.001."

That is the difference between a claim and evidence.

---

## What Belongs In The Research Layer

Everything in this layer is for engineering, validation,
and certification. Nothing here touches the live court.
Research Layer owns:
Simulation Framework
Timeline Service
Branch Manager
Experiment Engine
Validation Framework
Metrics Engine

Research Layer never touches:
Live officiating path
Production MatchFlow instance
Tournament data without explicit authorization

text

---

## The Timeline Service

The Timeline Service is the foundational abstraction
of the Research Platform.

It treats MatchFlow as a timeline rather than a state.

```typescript
interface TimelineService {
  // Get the MatchState at exactly this timestamp
  // Returns most recent snapshot at or before timestamp_s
  stateAt(timestamp_s: number): MatchState | null

  // Get all states within a time range
  statesBetween(
    start_s: number,
    end_s: number
  ): MatchState[]

  // Get the total duration of this timeline
  duration(): number

  // Get the session this timeline belongs to
  session_id: string

  // Where this timeline originated
  source: 'live' | 'replay' | 'simulation' | 'test'
}
```

Every event in the system has:
timestamp_ns — primary ordering key
sequence_id — monotonic counter for same-ns ordering
source — live / replay / simulation / test
confidence — system confidence at this moment
payload — complete MatchState snapshot

text

The Timeline Service answers one question:
"What was the state of the world at time t?"
No special cases. No mode switching.
Live, replay, and simulation are identical.

---

## The Branch Manager

The Branch Manager enables controlled experiments by
forking the timeline at any arbitrary timestamp.

```typescript
interface Branch {
  id:             string
  name:           string
  fork_time_s:    number      // timestamp where branch diverges
  parent_id:      string      // 'main' or another branch id
  variables:      Record<string, unknown>  // what changed
  timeline:       TimelineService
  metrics:        BranchMetrics
  status:         'running' | 'complete' | 'failed'
}

interface BranchManager {
  // Fork a new branch from any point on any timeline
  fork(
    source: TimelineService,
    fork_time_s: number,
    variables: Record<string, unknown>,
    name: string
  ): Branch

  // Get a specific branch
  get(branch_id: string): Branch | null

  // Get all branches for a session
  list(session_id: string): Branch[]

  // Compare two branches quantitatively
  compare(branch_a: string, branch_b: string): ComparisonReport
}
```

Example — Camera Architecture Comparison:
Main timeline: 10 x 522 FPS, full match

Fork at t = 45.0s (just before a serve):
Branch A: 10 x 522 FPS (unchanged)
Branch B: 8 x 522 FPS (cameras 9,10 disabled)
Branch C: 6 x 522 FPS (cameras 7,8,9,10 disabled)

All three branches experience:
identical serve
identical spin
identical bounce
identical environmental conditions

Only the sensing architecture differs.
That is a controlled experiment.

text

### Branch Manager Constraints
Live officiating: branching is permanently disabled
on the live officiating data path

Replay mode: branching allowed, labeled clearly
as non-authoritative

Simulation: branching is the primary use case
unlimited branches supported

Maximum branches: 256 per session (memory constraint)
Branch isolation: branches never write to parent timeline
Branch lifetime: branches are discarded after experiment
completes unless explicitly archived

text

---

## The Experiment Engine

The Experiment Engine is the generalization of the
Branch Manager. Branches are its implementation detail.

```typescript
interface Experiment {
  id:          string
  name:        string
  description: string

  // What is being varied
  variables: {
    name:      string
    values:    unknown[]    // discrete values to test
    unit:      string
  }[]

  // What is being measured
  evaluation: {
    metric:    string       // e.g. 'trajectory_rmse_mm'
    target:    number       // desired value
    threshold: number       // minimum acceptable
    direction: 'lower' | 'higher'
  }[]

  // How to run it
  execution: {
    fork_time_s:     number     // where to branch
    duration_s:      number     // how long to run each branch
    repetitions:     number     // for Monte Carlo
    seed:            number     // for determinism
  }

  // Results when complete
  results?: ExperimentReport
}

interface ExperimentEngine {
  schedule(experiment: Experiment): string   // returns experiment id
  run(experiment_id: string): Promise<ExperimentReport>
  cancel(experiment_id: string): void
  list(): Experiment[]
  get(experiment_id: string): Experiment | null
}
```

Example experiments:
Experiment: Camera Architecture Sweep
Variables:
camera_count:
fps:
Evaluation:
trajectory_rmse_mm: target 2.0, threshold 5.0, lower
line_call_accuracy: target 99.9, threshold 99.0, higher
pipeline_latency_ms: target 50, threshold 100, lower
Execution:
fork_time_s: 45.0
duration_s: 30.0
repetitions: 100
seed: 42

Experiment: UKF Parameter Sweep
Variables:
process_noise: [0.001, 0.01, 0.1]
measurement_noise: [0.1, 1.0, 10.0]
Evaluation:
filter_convergence_ms: lower
innovation_score: lower
occlusion_recovery_ms: lower

Experiment: Failure Mode Analysis
Variables:
failed_cameras: [, , ,]
failure_timing: ['pre_serve', 'mid_rally', 'at_bounce']
Evaluation:
calls_requiring_review: lower
confidence_degradation: lower
recovery_time_ms: lower

text

---

## The Validation Framework

The Validation Framework runs automatically on every
significant change to the system.
Validation Report — generated per build or manually

MatchPoint Validation Report
Session: [session_id]
Timestamp: [ISO timestamp]
Commit: [git hash]

Trajectory RMSE 2.1mm PASS (threshold 5.0mm)
Line-call accuracy 99.94% PASS (threshold 99.0%)
Prediction latency 43ms PASS (threshold 100ms)
Fusion confidence 0.94 PASS (threshold 0.85)
Tracking continuity 98.7% PASS (threshold 95.0%)
False positives 0.02% PASS (threshold 0.1%)
False negatives 0.04% PASS (threshold 0.1%)
Occlusion recovery 87ms PASS (threshold 200ms)
Replay determinism 100% PASS (must be 100%)
Simulation repeatability 100% PASS (must be 100%)
Hardware sync delta 73us PASS (threshold 100us)

Overall: PASS 11/11 checks

text

Every check answers: did we improve, regress, or stay the same?

---

## The Metrics Engine

The Metrics Engine computes quantitative measures
from MatchState sequences.

```typescript
interface MetricsEngine {
  // Compute all metrics for a timeline segment
  compute(
    timeline: TimelineService,
    start_s: number,
    end_s: number
  ): MetricsReport

  // Compare metrics between two timelines
  compare(
    timeline_a: TimelineService,
    timeline_b: TimelineService
  ): ComparisonReport

  // Run Monte Carlo over multiple experiment repetitions
  monteCarlo(
    experiment: Experiment,
    repetitions: number
  ): MonteCarloReport
}

interface MetricsReport {
  trajectory_rmse_mm:      number
  line_call_accuracy_pct:  number
  false_positive_pct:      number
  false_negative_pct:      number
  pipeline_latency_ms:     number
  fusion_confidence:       number
  tracking_continuity_pct: number
  occlusion_recovery_ms:   number
  replay_determinism_pct:  number
  simulation_repeatability: number
}
```

---

## Counterfactual Analysis

The Research Platform enables answering questions
that cannot be answered any other way.

Examples:
"What would the call have been if Camera 7 had failed?"
Fork at (timestamp - 5s)
Disable camera 7 in branch
Run through the disputed call
Compare officiating.last_call between branches

"What if measurement noise doubled from sun glare?"
Fork at serve
Double covariance in branch
Compare trajectory_rmse and confidence

"What if we had used the previous firmware version?"
Fork at session start
Inject old firmware noise model
Run complete match
Compare full MetricsReport

"Does a new UKF formulation improve occlusion recovery?"
Fork at every occlusion event
Run current and new UKF in parallel branches
Compare occlusion_recovery_ms across all events
Statistical significance test on results

text

---

## Debugging Workflow

When a rare bug appears at timestamp t:
Identify the timestamp of the failure
e.g. t = 15.237s

Fork just before the failure
fork_time_s = 15.200s

Run the branch with:
extra logging enabled
modified parameters
deterministic seed
step-through at 0.01x speed

Reproduce the failure deterministically

Modify parameters and re-run
No need to replay the entire session
Branch runs from the fork point only

Fix confirmed when branch produces
correct output from fork_time_s onward

text

This transforms debugging from archaeology
into experimental science.

---

## Monte Carlo Execution

For statistically valid results, the Experiment Engine
supports Monte Carlo execution.
Run the same experiment N times with different noise seeds.
Aggregate results across all runs.
Report mean, standard deviation, and confidence intervals.

Example:
Camera Architecture Sweep
10 cameras vs 8 cameras
1000 repetitions each
Different noise seed per repetition

Results:
10 cameras: accuracy 99.97% ± 0.02% (95% CI)
8 cameras: accuracy 97.31% ± 0.18% (95% CI)
p-value: < 0.001 (statistically significant)

That result is ITF-certification-grade evidence.

text

---

## Current Implementation Status

| Component              | Status   | Notes                            |
|------------------------|----------|----------------------------------|
| Timeline Service       | Pending  | ao2022_frames.js is proto        |
| Branch Manager         | Pending  | Architecture defined             |
| Experiment Engine      | Pending  | Schema defined                   |
| Validation Framework   | Pending  | Metrics defined                  |
| Metrics Engine         | Pending  | Metrics defined                  |
| Monte Carlo            | Pending  | Depends on Experiment Engine     |
| Counterfactual tools   | Pending  | Depends on Branch Manager        |

The current ao2022_frames.js provides 2101 recorded frames
that serve as the first input to a future Timeline Service.
The Research Platform is the next major build phase.

---

## Remaining Documents

| Doc | Title                              | Status  |
|-----|------------------------------------|---------|
| 1   | Reference Architecture             | Draft   |
| 2   | MatchFlow Specification            | Draft   |
| 3   | Visual Runtime Specification       | Draft   |
| 4   | Hardware Abstraction Layer Spec    | Draft   |
| 5   | Research Platform Spec (this file) | Draft   |
| 6   | Engineering Principles             | Pending |

---

_The Research Platform exists for one reason:
to replace assumptions with evidence.
Every experiment is a question.
Every report is an answer._

---

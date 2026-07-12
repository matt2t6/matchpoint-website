---

# MatchPoint Systems — Engineering Principles
**Document 6 of 6 | Version 1.0 | July 2026**
**Status: Living Document**

---

## Purpose

This document records the engineering philosophy of
MatchPoint Systems.

Unlike the other five documents, this one does not
describe interfaces, schemas, or implementations.

It describes how we think.

These principles exist because as the team grows,
the most expensive mistakes are not bugs in code —
they are decisions that violate the architecture before
anyone realizes it. These principles are the early
warning system for those decisions.

When a proposal feels wrong but you cannot articulate why,
return to this document.

---

## The Principles

---

### 1. Time is the primary abstraction.

Every event, measurement, and state has a timestamp_ns.
Frame numbers, sequence counters, array indices, and
wall clock times are implementation details.

When in doubt, use the timestamp.

The question "what frame is this?" is less useful than
"what time is this?" because time is universal across
all modes — live, replay, simulation, and test.

A system that thinks in frames is fragile.
A system that thinks in time is general.

---

### 2. Physics is authoritative.

The system models reality, not approximations of reality.
When engineering convenience conflicts with physical
accuracy, physical accuracy wins.

This means:
- Ball interpolation uses kinematic equations, not easing
- Gravity is always 9.81 m/s²
- Spin, drag, and Magnus force are modeled when known
- Confidence values reflect actual uncertainty

A system that fakes physics for visual convenience
will fail exactly when physical accuracy matters most —
which is during a disputed line call.

---

### 3. MatchFlow is the single source of truth.

No subsystem owns physical state independently.
All state flows through MatchFlow.
Nothing bypasses it.

If two parts of the system disagree about the state
of the world, MatchFlow is correct by definition.

The corollary: if MatchFlow is wrong, everything is
wrong. Keep MatchFlow correct first.

---

### 4. Rendering consumes state. It never owns it.

The Visual Runtime displays what MatchFlow says is true.
It does not decide what is true.

A renderer that modifies state — even temporarily,
even for visual smoothing — introduces a category of
bugs that are nearly impossible to diagnose because
the visual output and the data disagree.

The renderer is a pure function of time and MatchState.
It has no memory of its own.

---

### 5. Live officiating has exactly one authoritative timeline.

Branching, experimentation, and simulation are
research tools. They are permanently isolated from
the live officiating data path.

There is no mode, flag, or configuration that enables
branching on a live court during a match.

This is not a technical limitation. It is a design
decision. Officiating requires a single unambiguous
answer. Research requires the freedom to explore
alternatives. These two requirements are incompatible
on the same data path.

---

### 6. Simulation exists to replace assumptions with evidence.

Every hardware choice, algorithm parameter, and
architectural decision should be validated by the
simulator before reaching a live court.

The correct answer to "why ten cameras?" is not
"we think ten is enough." It is a Validation Report
with statistical significance.

Assumptions are expensive. The simulator is cheap.
Use it.

---

### 7. Every subsystem must be replayable.

If a subsystem cannot reproduce its exact output
from a recorded MatchState sequence, it is not
correctly built.

Non-replayable subsystems cannot be:
- debugged deterministically
- regression tested
- used in the Research Platform
- certified by the ITF

Replayability is not a feature. It is a requirement.

---

### 8. Hardware is hidden behind abstractions.

Whether data comes from simulation or 10 x 522 FPS
cameras is irrelevant to every layer above the HAL.

A system that leaks hardware details upward becomes
impossible to test without physical hardware and
impossible to simulate accurately with it.

The HAL boundary is enforced, not suggested.

---

### 9. Coupling decreases as the system matures.

New subsystems should clarify responsibilities,
not entangle them.

When a new feature requires two existing subsystems
to know about each other, that is a signal the
architecture needs a new abstraction — not a direct
connection between the two subsystems.

The health of the architecture is measured by how
independently its layers can be developed, tested,
and replaced.

---

### 10. Confidence is always honest.

Every measurement, prediction, and call has a
confidence value. That value must reflect actual
uncertainty, not desired certainty.

Overconfident systems fail silently.
Honest systems fail visibly.
Visible failures are recoverable.
Silent failures reach live courts.

When the system does not know, it says so.

---

### 11. The external story is simple. The internal architecture is general.

Externally:
  "We are building the most accurate, affordable,
   and intelligent tennis officiating and coaching
   platform."

Internally:
  Design every abstraction to be sport-agnostic.

Tennis proves the architecture.
The architecture serves any sport.

Do not advertise generality before tennis works.
Do not build tennis-only abstractions that prevent
generality later.

---

### 12. Evidence over claims.

The most credible statement MatchPoint can make
to an investor, certifying body, or tournament
director is a Validation Report, not a pitch deck.

Claims: "Our system achieves 99.9% accuracy."
Evidence: Validation Report, 1000 Monte Carlo runs,
          p < 0.001, signed session data.

Build the infrastructure to produce evidence.
The claims follow automatically.

---

## How To Use These Principles

When evaluating a new feature or design decision,
ask these questions in order:
Does this respect time as the primary abstraction?

Is physics modeled correctly or approximated for convenience?

Does this bypass MatchFlow?

Does the renderer own any state it should not own?

Does this touch the live officiating path inappropriately?

Have we validated this with the simulator?

Is this subsystem replayable?

Does this leak hardware details upward?

Does this increase coupling between existing subsystems?

Are confidence values honest?

Are we building tennis-specific when we should be general?

Are we making claims we cannot support with evidence?

text

If the answer to any question is yes, reconsider the design
before writing code.

---

## On Changing These Principles

These principles are not immutable.
They are the current best understanding of what makes
MatchPoint work well.

If evidence emerges that a principle is wrong —
genuinely wrong, not just inconvenient — it should
be updated with a clear explanation of why.

The version history of this document is itself a record
of how the team's understanding has matured.

---

## Document History

| Version | Date      | Change                          |
|---------|-----------|---------------------------------|
| 1.0     | July 2026 | Initial principles established  |

---

## Complete Document Set

| Doc | Title                              | Status        |
|-----|------------------------------------|---------------|
| 1   | Reference Architecture             | Draft         |
| 2   | MatchFlow Specification            | Draft         |
| 3   | Visual Runtime Specification       | Draft         |
| 4   | Hardware Abstraction Layer Spec    | Draft         |
| 5   | Research Platform Specification    | Draft         |
| 6   | Engineering Principles (this file) | Living Document|

---

_These principles exist to make the right decision
obvious and the wrong decision uncomfortable._

---

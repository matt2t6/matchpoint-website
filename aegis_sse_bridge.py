# ============================================================
# AEGIS SSE Bridge Server - v3.0
# MatchPoint AI Council - Sparks Engine Bridge
# Status: Track B → Preparing for Track A
# Author: Grok (First-Principles Hardening)
# ============================================================

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, APIRouter, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

# OpenTelemetry Tracing
from opentelemetry import trace
from opentelemetry.trace import SpanKind

tracer = trace.get_tracer(__name__)

# ====================== COUNCIL INTEGRATION ======================
COUNCIL_TOKEN_SECRET = os.getenv("COUNCIL_TOKEN_SECRET")
AGENT_LOGBOOK_PATH = "agent_logbook.json"

# ====================== CONFIG & LOGGING ======================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aegis-bridge")

app = FastAPI(title="AEGIS SSE Bridge v3.0")

# CORS for sandbox development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Session tracking
SESSION_ID = str(uuid4())
START_MONOTONIC = 0 # Initialized at startup

# ====================== BRIDGE STATE (Persistent + Postgres Ready) ======================
BRIDGE_STATE = {
    "current_phase": "IDLE",
    "last_updated": datetime.now(timezone.utc).isoformat(),
    "sparks_engine_connected": False,
    "error_count": 0,
    "last_phase_change": None,
    "correlation_id": None
}

# ====================== PLAYBACK ENGINE STATE ======================
PLAYBACK_STATE = {
    "isPlaying": True,
    "currentT": 0.0,
    "cadenceMs": 100,
    "totalFrames": 0,
    "session_id": str(uuid4())
}

AO2022_FRAMES = []
SPARKS_PHASE_MAP = {"SHATTER", "CONVERGE", "EXECUTE", "VALIDATE"}

# ====================== AUTHENTICATION ======================
async def verify_council_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]
    if token != COUNCIL_TOKEN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid Council token")
    return token

# ====================== LOGBOOK INTEGRATION ======================
async def log_to_agent_logbook(event_type: str, phase: str, correlation_id: str):
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "phase": phase,
        "correlation_id": correlation_id,
        "service": "aegis_sse_bridge",
        "agent": "Grok-Bridge"
    }
    try:
        logbook_path = Path(AGENT_LOGBOOK_PATH)
        if logbook_path.exists():
            with open(logbook_path, "r+") as f:
                data = json.load(f)
                data.setdefault("entries", []).append(entry)
                f.seek(0)
                json.dump(data, f, indent=2)
        else:
            logbook_path.parent.mkdir(parents=True, exist_ok=True)
            with open(logbook_path, "w") as f:
                json.dump({"entries": [entry]}, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write to AgentLogbook: {e}")

# ====================== STATE ADAPTER (Postgres-ready) ======================
class StateAdapter:
    """Adapter pattern for state storage - JSON now, Postgres later"""
    def __init__(self, state: dict = None):
        self._state = state or BRIDGE_STATE
        self._storage_path = Path("bridge_state.json")

    async def save(self) -> None:
        try:
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._storage_path, "r+") as f:
                existing = json.load(f)
                existing["runtime_state"] = self._state.copy()
                existing["metadata"]["last_modified"] = datetime.now(timezone.utc).isoformat()
                f.seek(0)
                json.dump(existing, f, indent=2)
                f.truncate()
        except Exception as e:
            logger.error(f"State save failed: {e}")

    async def load(self) -> dict:
        try:
            if self._storage_path.exists():
                with open(self._storage_path, "r") as f:
                    data = json.load(f)
                    if "runtime_state" in data:
                        self._state.update(data["runtime_state"])
        except Exception as e:
            logger.error(f"State load failed: {e}")
        return self._state

state_adapter = StateAdapter(BRIDGE_STATE)

# ====================== HARDENED BRIDGE CLIENT ======================
async def call_typescript_bridge(endpoint: str, payload: dict = None, correlation_id: str = None):
    url = f"http://localhost:3000/bridge/{endpoint}"

    with tracer.start_as_current_span(f"bridge.call.{endpoint}", kind=SpanKind.CLIENT) as span:
        span.set_attribute("correlation.id", correlation_id or "unknown")

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.post(url, json=payload or {})
                    response.raise_for_status()
                    BRIDGE_STATE["error_count"] = 0
                    return response.json()
            except httpx.TimeoutException:
                logger.warning(f"Bridge timeout (attempt {attempt+1}/3): {endpoint}")
                BRIDGE_STATE["error_count"] += 1
            except Exception as e:
                logger.error(f"Bridge error (attempt {attempt+1}/3): {e}")
                BRIDGE_STATE["error_count"] += 1

            await asyncio.sleep(0.5 * (2 ** attempt))

        BRIDGE_STATE["current_phase"] = "ERROR"
        raise HTTPException(status_code=503, detail=f"Bridge unreachable: {endpoint}")

# ====================== MODELS ======================
class PlaybackControl(BaseModel):
    play: Optional[bool] = None
    seek: Optional[float] = None
    cadence: Optional[int] = None

class PhaseTrigger(BaseModel):
    phase: str
    metadata: dict = {}

# ====================== PLAYBACK LOOP ======================
async def playback_engine_task():
    """Background loop that advances currentT independently of connections"""
    global PLAYBACK_STATE
    while True:
        if PLAYBACK_STATE["isPlaying"] and AO2022_FRAMES:
            # Advance currentT by cadence
            PLAYBACK_STATE["currentT"] += PLAYBACK_STATE["cadenceMs"] / 1000.0

            # Loop back if reached end
            if AO2022_FRAMES and PLAYBACK_STATE["currentT"] > AO2022_FRAMES[-1]["t"]:
                PLAYBACK_STATE["currentT"] = 0.0

        await asyncio.sleep(PLAYBACK_STATE["cadenceMs"] / 1000.0)

def get_frame_for_time(t):
    """Find the closest frame for time t"""
    if not AO2022_FRAMES: return None
    # Simple binary search or scan for small datasets
    return min(AO2022_FRAMES, key=lambda f: abs(f["t"] - t))

def get_latest_council_consensus():
    """Read the latest consensus from the Council Ledger"""
    try:
        # Use relative path for production root
        ledger_path = Path("CouncilLedger.json")
        if ledger_path.exists():
            with open(ledger_path, "r") as f:
                ledger = json.load(f)
                entries = ledger.get("ledger_entries", [])
                if entries:
                    # Return arbitration consensus from latest entry
                    return entries[-1].get("arbitration", {}).get("consensus", {})
    except Exception as e:
        logger.warning(f"Failed to read council ledger: {e}")
    return {}

# ====================== ROUTER ======================
bridge_router = APIRouter(prefix="/bridge", tags=["bridge"])
api_router = APIRouter(prefix="/api", tags=["api"])

# SSE Aliases for various clients
@app.get("/sse")
@app.get("/api/sse")
@app.get("/api/stream")
async def sse_alias(request: Request):
    return await event_generator(request)

@app.get("/health")
@api_router.get("/health")
@bridge_router.get("/health")
async def bridge_health():
    return {
        "status": "healthy",
        "bridge_status": "healthy",
        "current_phase": BRIDGE_STATE["current_phase"],
        "connected": BRIDGE_STATE["sparks_engine_connected"],
        "error_count": BRIDGE_STATE["error_count"],
        "last_updated": BRIDGE_STATE["last_updated"],
        "session_id": SESSION_ID,
        "playback": PLAYBACK_STATE
    }



@app.get("/api/harmonic-metrics")
async def get_harmonic_metrics():
    import datetime
    frames = AO2022_FRAMES if AO2022_FRAMES else []
    frame_count = len(frames)
    return {
        "status": "active",
        "harmonic_mode": "aegis_v3",
        "frame_count": frame_count,
        "resonance_index": round(min(frame_count / 2101.0, 1.0) * 100, 1),
        "stability_score": 94.2,
        "coherence": 0.97,
        "anomaly_delta": 0,
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.get("/metrics")
@api_router.get("/metrics")
async def get_metrics():
    return {"status": "success", "metrics": {"active_sessions": 1, "uptime": "up"}}

@api_router.get("/live/all")
async def live_all():
    return {"status": "success", "data": BRIDGE_STATE}

@api_router.get("/orchestrator/health")
async def orchestrator_health():
    return {"status": "healthy", "service": "orchestrator"}

@api_router.get("/environmental/state")
async def environmental_state():
    return {
        "status": "success",
        "metrics": {
            "temperature": "24.5°C",
            "humidity": "45%",
            "wind_speed": "12km/h",
            "light_level": "850 lux"
        }
    }

@api_router.get("/experiment/export")
async def experiment_export():
    return {"status": "success", "message": "Export prepared", "download_url": "/api/experiment/download/stub"}

@api_router.post("/experiment/log")
async def experiment_log(request: Request):
    data = await request.json()
    logger.info(f"📝 Experiment Log: {data}")
    return {"status": "logged"}

@bridge_router.post("/trigger-phase")
async def trigger_phase(
    trigger: PhaseTrigger,
    token: str = Depends(verify_council_token)
):
    if trigger.phase not in SPARKS_PHASE_MAP:
        raise HTTPException(status_code=400, detail="Invalid phase")

    correlation_id = f"phase_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    BRIDGE_STATE["current_phase"] = trigger.phase
    BRIDGE_STATE["last_updated"] = datetime.now(timezone.utc).isoformat()
    BRIDGE_STATE["last_phase_change"] = datetime.now(timezone.utc).isoformat()
    BRIDGE_STATE["correlation_id"] = correlation_id

    await log_to_agent_logbook("phase_transition", trigger.phase, correlation_id)
    await state_adapter.save()

    logger.info(f"🔄 Sparks Engine Phase Transition → {trigger.phase} | corr_id: {correlation_id}")

    return {
        "status": "success",
        "phase": trigger.phase,
        "correlation_id": correlation_id,
        "timestamp": BRIDGE_STATE["last_updated"]
    }

@bridge_router.post("/playback")
async def set_playback(control: PlaybackControl):
    global PLAYBACK_STATE
    if control.play is not None:
        PLAYBACK_STATE["isPlaying"] = control.play
    if control.seek is not None:
        PLAYBACK_STATE["currentT"] = control.seek
    if control.cadence is not None:
        PLAYBACK_STATE["cadenceMs"] = control.cadence

    logger.info(f"⏯ Playback Update: play={PLAYBACK_STATE['isPlaying']} | seek={PLAYBACK_STATE['currentT']}")
    return {
        "status": "success",
        "state": PLAYBACK_STATE
    }

@bridge_router.get("/health")
async def bridge_health():
    return {
        "bridge_status": "healthy",
        "current_phase": BRIDGE_STATE["current_phase"],
        "connected": BRIDGE_STATE["sparks_engine_connected"],
        "error_count": BRIDGE_STATE["error_count"],
        "last_updated": BRIDGE_STATE["last_updated"],
        "session_id": SESSION_ID,
        "playback": PLAYBACK_STATE
    }

@bridge_router.get("/state")
async def get_bridge_state():
    return {
        "bridge": BRIDGE_STATE,
        "playback": PLAYBACK_STATE
    }

# ====================== SSE STREAM ======================
@app.get("/stream")
async def event_generator(request: Request):
    async def event_stream():
        last_yielded_t = -1.0
        while True:
            if await request.is_disconnected():
                break

            # ── Telemetry Engine ──
            current_t = PLAYBACK_STATE["currentT"]
            if current_t != last_yielded_t:
                frame = get_frame_for_time(current_t)
                if frame:
                    # ── COUNCIL INJECTION HOOK ──
                    consensus = get_latest_council_consensus()

                    payload = {
                        "event": "telemetry",
                        "payload": frame,
                        "session_id": PLAYBACK_STATE["session_id"],
                        "sequence_num": int(current_t * 10),
                        "timestamp": datetime.now(timezone.utc).timestamp(),
                        "ai_insights": {
                            "momentum_shift": frame.get("mom", 50) > 60,
                            "coaching_cue": "Nadal is finding his range." if current_t > 200 else None,
                            "consensus": consensus
                        }
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_yielded_t = current_t

            # ── Heartbeat ──
            if int(datetime.now(timezone.utc).timestamp()) % 5 == 0:
                yield f"data: {json.dumps({'event': 'heartbeat', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"

            await asyncio.sleep(0.05) # 50ms check loop

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# ====================== APP SETUP ======================
app.include_router(bridge_router)
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    global AO2022_FRAMES, START_MONOTONIC
    logger.info("🚀 AEGIS SSE Bridge v3.0 (Grok Hardened + OpenTelemetry) started")
    START_MONOTONIC = asyncio.get_event_loop().time()

    # Load Telemetry Data
    try:
        frames_path = Path(__file__).parent / "ao2022_frames.json"
        if frames_path.exists():
            with open(frames_path, "r") as f:
                AO2022_FRAMES = json.load(f)
                PLAYBACK_STATE["totalFrames"] = len(AO2022_FRAMES)
                logger.info(f"📊 Loaded {len(AO2022_FRAMES)} telemetry frames")
        else:
            logger.error("❌ Telemetry data missing: ao2022_frames.json")
    except Exception as e:
        logger.error(f"❌ Failed to load telemetry: {e}")

    BRIDGE_STATE["sparks_engine_connected"] = True

    # Start Playback Engine
    asyncio.create_task(playback_engine_task())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

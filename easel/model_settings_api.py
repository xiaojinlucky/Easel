"""AI 模型设置 API：官方 Codex 目录、档案、先测再保存。"""
import asyncio
import hashlib
import subprocess
import time
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from easel.model_runtime import (
    CONFIG_FILE, CREATE_FLAGS, PROFILE, SETTINGS_FILE,
    apply_openclaw_models, agent_reply, codex_command, codex_rpc,
    model_catalog, openclaw_command, read_settings, run_agent_command,
    runtime_env, subscription_status, write_json,
)

router = APIRouter(prefix="/api/model-settings")
_tested: dict[str, dict] = {}
_save_lock = asyncio.Lock()


class ModelProfile(BaseModel):
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,64}$")
    name: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=100)
    reasoning_effort: str = Field(min_length=1, max_length=20)


class ModelSettings(BaseModel):
    active_id: str
    profiles: list[ModelProfile] = Field(min_length=1, max_length=20)


def fingerprint(profile: ModelProfile) -> str:
    return hashlib.sha256(profile.model.encode()).hexdigest()


def determined_models(previous: dict) -> set[str]:
    """已经在用、已经测过的型号。换型号才要再测；只改推理强度不算换型号。"""
    names = {p.get("model") for p in previous.get("profiles") or [] if p.get("model")}
    last = previous.get("last_test") or {}
    if last.get("model"):
        names.add(last["model"])
    for probe in _tested.values():
        if probe.get("model"):
            names.add(probe["model"])
    return names


def validate_profile(profile: ModelProfile) -> None:
    entry = next((m for m in model_catalog() if m["model"] == profile.model), None)
    if entry is None:
        raise ValueError("该模型不在当前账号返回的可用目录中，请刷新模型。")
    efforts = [e["reasoningEffort"] for e in entry.get("supportedReasoningEfforts", [])]
    if profile.reasoning_effort not in efforts:
        raise ValueError("该模型不支持所选推理强度。")


@router.get("")
async def settings_get():
    settings = read_settings()
    if not SETTINGS_FILE.is_file():
        try:
            apply_openclaw_models(settings)
            write_json(SETTINGS_FILE, settings)
        except Exception:
            pass
    return {**settings, "provider": "codex_subscription"}


@router.get("/status")
async def settings_status():
    try:
        return await asyncio.to_thread(subscription_status)
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc


@router.get("/catalog")
async def settings_catalog():
    try:
        return {"models": await asyncio.to_thread(model_catalog, True)}
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc


@router.post("")
async def settings_save(request: ModelSettings):
    ids = [p.id for p in request.profiles]
    if len(ids) != len(set(ids)) or request.active_id not in ids:
        raise HTTPException(422, "档案标识重复或未选择有效档案。")
    active = next(p for p in request.profiles if p.id == request.active_id)
    try:
        for profile in request.profiles:
            await asyncio.to_thread(validate_profile, profile)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    async with _save_lock:
        previous = read_settings()
        if active.model not in determined_models(previous):
            raise HTTPException(409, "请先测试所选模型，再保存并启用。同一模型只改推理强度不用再测。")
        apply_openclaw_models(request.model_dump())
        saved = request.model_dump()
        saved["verified_fingerprint"] = fingerprint(active)
        saved["last_test"] = _tested.get(fingerprint(active), previous.get("last_test"))
        write_json(SETTINGS_FILE, saved)
    return {"ok": True, **saved}


def run_probe(profile: ModelProfile) -> dict:
    validate_profile(profile)
    started = time.monotonic()
    identifier = str(uuid.uuid4())
    command = openclaw_command() + [
        "--profile", PROFILE, "agent", "--agent", "main",
        "--session-id", identifier, "--session-key", "agent:main:probe-" + identifier,
        "--model", "openai/" + profile.model, "--thinking", profile.reasoning_effort,
        "--timeout", "120", "--json",
        "--message", "这是 Easel 订阅连通性测试，不调用工具、不读取文件。只回复 EASEL_READY。",
    ]
    result = run_agent_command(command, timeout=150)
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout)[-1800:])
    reply = agent_reply(result.stdout)
    if reply != "EASEL_READY":
        raise RuntimeError("模型没有返回预期测试应答：" + result.stdout[-600:])
    probe = {
        "ok": True, "model": profile.model, "reasoning_effort": profile.reasoning_effort,
        "latency_seconds": round(time.monotonic() - started, 2),
        "tested_at": time.time(), "reply": "EASEL_READY",
    }
    _tested[fingerprint(profile)] = probe
    return probe


@router.post("/probe")
async def settings_probe(profile: ModelProfile):
    try:
        return await asyncio.to_thread(run_probe, profile)
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc


@router.post("/login")
async def settings_login():
    account = (await asyncio.to_thread(codex_rpc, [("account/read", {"refreshToken": False})]))[0].get("account") or {}
    if account.get("type") == "chatgpt":
        return {"ok": True, "message": "已使用 ChatGPT 订阅登录。"}
    log = SETTINGS_FILE.parent / "logs/codex-login.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open("a", encoding="utf-8") as output:
        subprocess.Popen(codex_command() + ["login"], cwd=str(SETTINGS_FILE.parent), env=runtime_env(), stdout=output, stderr=output, creationflags=CREATE_FLAGS)
    return {"ok": True, "message": "已启动官方网页登录；完成后点击检测登录。"}

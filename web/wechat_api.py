"""FastAPI routes for explicit, local WeChat publishing actions."""
from __future__ import annotations

import asyncio
from datetime import date as date_type
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from pydantic import BaseModel, Field, field_validator

from easel import wechat


class SafeValidationRoute(APIRoute):
    def get_route_handler(self):
        handler = super().get_route_handler()
        async def safe_handler(request):
            try:
                return await handler(request)
            except RequestValidationError as exc:
                # Pydantic normally echoes invalid input, including app_secret.
                errors = [{"loc": error["loc"], "msg": error["msg"], "type": error["type"]} for error in exc.errors()]
                raise HTTPException(422, detail=errors) from None
        return safe_handler


router = APIRouter(prefix="/api/wechat", route_class=SafeValidationRoute)


class AccountUpdate(BaseModel):
    key: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(min_length=1, max_length=120)
    app_id: str = Field(min_length=1, max_length=160)
    app_secret: str | None = Field(default=None, max_length=300)
    author: str | None = Field(default=None, max_length=120)


class AccountCheck(BaseModel):
    account: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")


class PrepareRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=2_000_000)
    author: str | None = Field(default=None, max_length=120)
    account: str | None = Field(default=None, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")


class DraftRequest(BaseModel):
    account: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    markdown_path: str = Field(min_length=1, max_length=1000)
    cover_path: str = Field(min_length=1, max_length=1000)
    title: str = Field(min_length=1, max_length=200)
    digest: str = Field(default="", max_length=120)
    author: str | None = Field(default=None, max_length=120)


class AnalyticsRequest(BaseModel):
    account: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("date")
    @classmethod
    def valid_date(cls, value: str) -> str:
        try:
            date_type.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("日期不是有效的日历日期。") from exc
        return value


def _safe_http_error(exc: Exception, status: int = 503) -> HTTPException:
    return HTTPException(status, wechat.sanitize_error(exc))


@router.get("")
async def wechat_dashboard() -> dict[str, Any]:
    try:
        return await asyncio.to_thread(wechat.dashboard)
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 503) from exc


@router.put("/accounts")
async def wechat_account_update(request: AccountUpdate) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(
            wechat.save_account,
            request.key,
            request.name,
            request.app_id,
            request.app_secret,
            request.author,
        )
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 422) from exc
    except OSError as exc:
        raise _safe_http_error(exc, 500) from exc


@router.post("/check")
async def wechat_account_check(request: AccountCheck) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(wechat.check_account, request.account)
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 503) from exc


@router.post("/prepare")
async def wechat_prepare(request: PrepareRequest) -> dict[str, str]:
    try:
        return await asyncio.to_thread(
            wechat.prepare_article,
            request.title,
            request.body,
            request.author,
            request.account,
        )
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 422) from exc


@router.post("/draft")
async def wechat_draft(request: DraftRequest) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(
            wechat.create_draft,
            request.account,
            request.markdown_path,
            request.cover_path,
            request.title,
            request.digest,
            request.author,
        )
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 422) from exc


@router.post("/analytics")
async def wechat_analytics(request: AnalyticsRequest) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(wechat.analytics, request.account, request.date)
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 503) from exc




class PublishRequest(BaseModel):
    account: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    media_id: str = Field(min_length=1, max_length=128)


@router.post("/publish")
async def wechat_publish(request: PublishRequest) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(wechat.publish_draft, request.account, request.media_id)
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 422) from exc


@router.post("/onboard")
async def wechat_onboard(request: AccountCheck) -> dict[str, Any]:
    try:
        return await asyncio.to_thread(wechat.onboard, request.account)
    except wechat.WechatError as exc:
        raise _safe_http_error(exc, 503) from exc

"""Pydantic スキーマ (API入出力)"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SensorSample(BaseModel):
    """センサー1個分の値"""
    sensor_index: int = Field(..., ge=0, le=15)
    raw: Optional[int] = Field(None, ge=0, le=4095)
    moisture_pct: float = Field(..., ge=0, le=100)


class ReadingBatchCreate(BaseModel):
    """ESP32 からの一括投稿"""
    device_id: str = Field(..., max_length=64)
    readings: list[SensorSample] = Field(..., min_length=1, max_length=16)


class ReadingOut(BaseModel):
    """API レスポンス用"""
    id: int
    device_id: str
    sensor_index: int
    raw: Optional[int]
    moisture_pct: float
    recorded_at: datetime
    model_config = ConfigDict(from_attributes=True)
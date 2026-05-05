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
    
class EnvironmentCreate(BaseModel):
    """環境データ登録用 (手入力 or 外部API取得)"""
    recorded_at: Optional[datetime] = None
    weather: Optional[str] = Field(None, max_length=32)
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = Field(None, ge=0, le=100)
    sunlight_hours: Optional[float] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=256)


class EnvironmentOut(BaseModel):
    """環境データ応答用"""
    id: int
    recorded_at: datetime
    weather: Optional[str]
    temperature_c: Optional[float]
    humidity_pct: Optional[float]
    sunlight_hours: Optional[float]
    note: Optional[str]
    model_config = ConfigDict(from_attributes=True)
    

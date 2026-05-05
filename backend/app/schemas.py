"""Pydantic スキーマ (API入出力)"""
from datetime import datetime
from datetime import date
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


class PlantCreate(BaseModel):
    variety: str = Field(..., max_length=64)
    planted_date: date
    note: Optional[str] = Field(None, max_length=256)


class PlantUpdate(BaseModel):
    """部分更新用 (PATCH)。全フィールド省略可"""
    variety: Optional[str] = Field(None, max_length=64)
    planted_date: Optional[date] = None
    note: Optional[str] = Field(None, max_length=256)


class PlantOut(BaseModel):
    id: int
    variety: str
    planted_date: date
    note: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
    
class WateringCreate(BaseModel):
    plant_id: int = Field(..., ge=1)
    watered_at: Optional[datetime] = None
    amount_ml: Optional[int] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=256)


class WateringOut(BaseModel):
    id: int
    plant_id: int
    watered_at: datetime
    amount_ml: Optional[int]
    note: Optional[str]
    model_config = ConfigDict(from_attributes=True)


class HarvestCreate(BaseModel):
    plant_id: int = Field(..., ge=1)
    harvested_on: date
    count: int = Field(1, ge=1)
    brix: Optional[float] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=256)


class HarvestOut(BaseModel):
    id: int
    plant_id: int
    harvested_on: date
    count: int
    brix: Optional[float]
    note: Optional[str]
    model_config = ConfigDict(from_attributes=True)



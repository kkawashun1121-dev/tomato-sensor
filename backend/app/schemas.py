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
    
class MeasurementSampleIn(BaseModel):
    """記録時に送る、センサー1本分の値"""
    sensor_index: int = Field(..., ge=0, le=2)
    raw: Optional[int] = Field(None, ge=0, le=4095)
    moisture_pct: float = Field(..., ge=0, le=100)


class MeasurementCreate(BaseModel):
    """1株ぶんの測定を記録 (3本のセンサーの値を送る)"""
    plant_id: int = Field(..., ge=1)
    measured_at: Optional[datetime] = None
    samples: list[MeasurementSampleIn] = Field(..., min_length=1, max_length=3)
    note: Optional[str] = Field(None, max_length=256)


class MeasurementOut(BaseModel):
    id: int
    plant_id: int
    measured_at: datetime
    raw_0: Optional[int]
    raw_1: Optional[int]
    raw_2: Optional[int]
    pct_0: Optional[float]
    pct_1: Optional[float]
    pct_2: Optional[float]
    avg_pct: float
    note: Optional[str]
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
    final_plant_height_cm: Optional[float] = Field(None, ge=0) 
    note: Optional[str] = Field(None, max_length=256)


class PlantUpdate(BaseModel):
    variety: Optional[str] = Field(None, max_length=64)
    planted_date: Optional[date] = None
    final_plant_height_cm: Optional[float] = Field(None, ge=0) 
    note: Optional[str] = Field(None, max_length=256)

class PlantOut(BaseModel):
    id: int
    variety: str
    planted_date: date
    final_plant_height_cm: Optional[float] 
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

class FruitCreate(BaseModel):
    plant_id: int = Field(..., ge=1)
    flowering_date: Optional[date] = None
    harvested_on: Optional[date] = None
    fruit_height_cm: Optional[float] = Field(None, ge=0)
    fruit_diameter_cm: Optional[float] = Field(None, ge=0)   
    fruit_weight_g: Optional[float] = Field(None, ge=0)     
    final_plant_height_cm: Optional[float] = Field(None, ge=0)
    brix: Optional[float] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=256)


class FruitUpdate(BaseModel):
    flowering_date: Optional[date] = None
    harvested_on: Optional[date] = None
    fruit_height_cm: Optional[float] = Field(None, ge=0)
    fruit_diameter_cm: Optional[float] = Field(None, ge=0)   
    fruit_weight_g: Optional[float] = Field(None, ge=0)      
    final_plant_height_cm: Optional[float] = Field(None, ge=0)
    brix: Optional[float] = Field(None, ge=0)
    note: Optional[str] = Field(None, max_length=256)

class FruitOut(BaseModel):
    id: int
    plant_id: int
    flowering_date: Optional[date]
    harvested_on: Optional[date]
    fruit_height_cm: Optional[float]
    fruit_diameter_cm: Optional[float]      
    fruit_weight_g: Optional[float]         
    final_plant_height_cm: Optional[float]
    brix: Optional[float]
    note: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SunlightSinceFlowering(BaseModel):
    """花が咲いてからの累積日照時間"""
    fruit_id: int
    flowering_date: date
    until: date
    total_sunlight_hours: float
    days: int

class ImageOut(BaseModel):
    id: int
    plant_id: Optional[int]
    fruit_id: Optional[int]
    filename: str
    original_name: Optional[str]
    content_type: Optional[str]
    description: Optional[str]
    taken_at: Optional[datetime]
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)
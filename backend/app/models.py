"""SQLAlchemy ORM モデル"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, func,Date
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base
from sqlalchemy import ForeignKey

class Watering(Base):
    __tablename__ = "waterings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plant_id: Mapped[int] = mapped_column(
        ForeignKey("plants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    watered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    amount_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(String(256), nullable=True)
    
    

class Reading(Base):
    __tablename__ = "readings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    sensor_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    raw: Mapped[int | None] = mapped_column(Integer, nullable=True)
    moisture_pct: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    
class EnvironmentReading(Base):
    __tablename__ = "environments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    weather: Mapped[str | None] = mapped_column(String(32), nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    sunlight_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(String(256), nullable=True)

class Plant(Base):
    __tablename__ = "plants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    variety: Mapped[str] = mapped_column(String(64), nullable=False)
    planted_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

class Harvest(Base):
    __tablename__ = "harvests"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plant_id: Mapped[int] = mapped_column(
        ForeignKey("plants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    harvested_on: Mapped[Date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    brix: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(String(256), nullable=True)
    
    
class Fruit(Base):
    __tablename__ = "fruits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plant_id: Mapped[int] = mapped_column(
        ForeignKey("plants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    flowering_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    harvested_on: Mapped[Date | None] = mapped_column(Date, nullable=True)
    fruit_height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    final_plant_height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    brix: Mapped[float | None] = mapped_column(Float, nullable=True)
    note: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
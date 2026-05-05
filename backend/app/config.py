"""アプリの設定 (環境変数から読み込み)"""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8",
        case_sensitive=False, extra="ignore",
    )

    database_url: str = Field(
        default="postgresql+psycopg://tomato:tomato@localhost:5433/tomato"
    )
    cors_origins: str = Field(default="http://localhost:5173")
    image_dir: str = "./data/images"

    @property
    def cors_origins_list(self) -> list[str]:
        """カンマ区切り文字列をリストに分割"""
        return [s.strip() for s in self.cors_origins.split(",") if s.strip()]


settings = Settings()
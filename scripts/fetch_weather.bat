@echo off
cd /d C:\project\tomato-sensor
echo [%DATE% %TIME%] Starting fetch_weather >> scripts\fetch_weather.log
python scripts\fetch_weather.py >> scripts\fetch_weather.log 2>&1
echo [%DATE% %TIME%] Finished >> scripts\fetch_weather.log
echo. >> scripts\fetch_weather.log
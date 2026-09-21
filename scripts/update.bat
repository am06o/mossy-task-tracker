@echo off
echo mossy 업데이트: 최신 코드를 받아서 설치 파일을 새로 만듭니다.
echo.

git pull
if errorlevel 1 goto :error

call npm install
if errorlevel 1 goto :error

call npm run dist
if errorlevel 1 goto :error

echo.
echo 완료. src-tauri\target\release\bundle\nsis\ 안의 setup.exe를 실행해서 설치하세요.
pause
exit /b 0

:error
echo.
echo 오류가 발생했습니다. 위 메시지를 확인하세요.
pause
exit /b 1

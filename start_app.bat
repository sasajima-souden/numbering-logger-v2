@echo off
REM 文字化け対策として、コードページをUTF-8に変更
chcp 65001 >nul

REM PowerShellを使って、非同期でサーバーを起動し、ブラウザを開く
powershell -Command "Start-Process cmd -ArgumentList '/c, serve -s "C:\Users\SDN_18\Desktop\build"' -WindowStyle Minimized; Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"

echo.
echo アプリケーションサーバーを起動しました。
echo ブラウザで http://localhost:3000 が自動的に開きます。
echo.
echo このウィンドウは閉じても構いませんが、
echo アプリケーションを終了する際は、タスクバーに表示される
echo 別のコマンドプロンプトのアイコンを右クリックして閉じてください。
echo.
pause

@echo off
REM 🚀 Скрипт деплоя с локального компьютера на сервер (Windows)

echo 🔥 TrackIsta Local to Server Deployment
echo ======================================

REM Проверяем файл конфигурации
if not exist ".env.deploy" (
    echo ❌ Файл .env.deploy не найден
    echo 💡 Создайте файл .env.deploy с настройками сервера
    echo 📖 См. .env.deploy.example
    pause
    exit /b 1
)

REM Собираем проект
echo 🏗️  Сборка проекта...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка сборки
    pause
    exit /b 1
)

if not exist "dist" (
    echo ❌ Папка dist не создана
    pause
    exit /b 1
)

echo ✅ Сборка завершена

REM Загружаем настройки из .env.deploy
for /f "delims== tokens=1,2" %%G in (.env.deploy) do set %%G=%%H

REM Выбираем способ деплоя
if "%DEPLOY_METHOD%"=="ftp" (
    echo 📡 Деплой через FTP...
    echo 💡 Для FTP деплоя используйте FileZilla или WinSCP
    echo 📁 Загрузите содержимое папки dist\ в %FTP_PATH%
    start explorer dist
    pause
    
) else if "%DEPLOY_METHOD%"=="scp" (
    echo 🔐 Деплой через SCP...
    scp -r -P %SSH_PORT% dist\* %SSH_USER%@%SSH_HOST%:%REMOTE_PATH%
    
) else (
    echo ❌ Неизвестный метод деплоя: %DEPLOY_METHOD%
    echo 💡 Для Windows рекомендуется использовать FTP или WinSCP
    pause
    exit /b 1
)

echo 🎉 Деплой завершен!
echo 🌐 Проверьте ваш сайт: %SITE_URL%
pause
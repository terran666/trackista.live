#!/bin/bash

# 🚀 Скрипт деплоя с локального компьютера на сервер

echo "🔥 TrackIsta Local to Server Deployment"
echo "======================================"

# Проверяем что файл конфигурации существует
if [ ! -f ".env.deploy" ]; then
    echo "❌ Файл .env.deploy не найден"
    echo "💡 Создайте файл .env.deploy с настройками сервера"
    echo "📖 См. .env.deploy.example"
    exit 1
fi

# Загружаем настройки
source .env.deploy

# Собираем проект
echo "🏗️  Сборка проекта..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Ошибка сборки"
    exit 1
fi

echo "✅ Сборка завершена"

# Выбираем способ деплоя
if [ "$DEPLOY_METHOD" = "ftp" ]; then
    echo "📡 Деплой через FTP..."
    
    # Используем lftp для загрузки
    lftp -c "
    set ssl:verify-certificate no
    open -u $FTP_USER,$FTP_PASS $FTP_HOST
    lcd dist
    cd $FTP_PATH
    mirror --reverse --delete --verbose
    bye
    "
    
elif [ "$DEPLOY_METHOD" = "scp" ]; then
    echo "🔐 Деплой через SCP..."
    
    # Загружаем через SCP
    scp -r -P $SSH_PORT dist/* $SSH_USER@$SSH_HOST:$REMOTE_PATH
    
elif [ "$DEPLOY_METHOD" = "rsync" ]; then
    echo "📂 Деплой через rsync..."
    
    # Синхронизация через rsync
    rsync -avz --delete -e "ssh -p $SSH_PORT" dist/ $SSH_USER@$SSH_HOST:$REMOTE_PATH
    
else
    echo "❌ Неизвестный метод деплоя: $DEPLOY_METHOD"
    echo "💡 Поддерживаются: ftp, scp, rsync"
    exit 1
fi

echo "🎉 Деплой завершен!"
echo "🌐 Проверьте ваш сайт: $SITE_URL"
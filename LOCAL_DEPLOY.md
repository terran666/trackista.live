# 📡 Деплой с локального компьютера на сервер

## 🚀 Быстрый старт

### 1. Настройка конфигурации
```bash
# Скопируйте пример конфигурации
cp .env.deploy.example .env.deploy

# Отредактируйте настройки вашего сервера
nano .env.deploy  # Linux/Mac
notepad .env.deploy  # Windows
```

### 2. Заполните данные сервера в `.env.deploy`:

#### Для обычного хостинга (FTP):
```bash
DEPLOY_METHOD=ftp
FTP_HOST=ftp.your-domain.com
FTP_USER=your-username
FTP_PASS=your-password
FTP_PATH=/public_html/
SITE_URL=https://your-domain.com
```

#### Для VPS/сервера (SSH):
```bash
DEPLOY_METHOD=rsync
SSH_HOST=123.45.67.89
SSH_USER=root
SSH_PORT=22
REMOTE_PATH=/var/www/html/
SITE_URL=https://your-domain.com
```

### 3. Запуск деплоя
```bash
# Linux/Mac
chmod +x deploy-to-server.sh
./deploy-to-server.sh

# Windows
deploy-to-server.bat
```

## 🛠 Методы деплоя

### 📡 FTP (рекомендуется для хостинга)
- ✅ Работает с любым хостингом
- ✅ Простая настройка
- ❗ Нужен FTP клиент (lftp для Linux)

### 🔐 SCP (для VPS)
- ✅ Безопасная передача
- ✅ Быстрая загрузка
- ❗ Нужен SSH доступ

### 📂 rsync (лучший для VPS)
- ✅ Синхронизация изменений
- ✅ Быстрое обновление
- ✅ Автоматическое удаление старых файлов
- ❗ Нужен SSH доступ

## 📋 Требования

### Для Linux/Mac:
```bash
# FTP
sudo apt install lftp  # Ubuntu/Debian
brew install lftp      # macOS

# SSH (обычно предустановлен)
ssh-keygen -t rsa      # Создать SSH ключ
```

### Для Windows:
- FTP: используйте FileZilla или WinSCP
- SSH: установите Git Bash или WSL

## 🔧 Настройка сервера

### Nginx конфигурация:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache .htaccess:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 🔍 Troubleshooting

### FTP ошибки:
- Проверьте данные FTP подключения
- Убедитесь что путь `/public_html/` правильный
- Попробуйте подключиться через FileZilla

### SSH ошибки:
- Проверьте SSH ключи: `ssh user@server`
- Убедитесь что порт правильный
- Проверьте права доступа к папке

### Права доступа:
```bash
# На сервере
chmod -R 755 /var/www/html/
chown -R www-data:www-data /var/www/html/
```

## 🎯 Автоматизация

Для регулярных обновлений создайте alias:
```bash
# В ~/.bashrc или ~/.zshrc
alias deploy="cd /path/to/trackista.live && ./deploy-to-server.sh"
```

Тогда деплой будет одной командой: `deploy`
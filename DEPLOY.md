# 🚀 Деплой на удаленный сервер

## 📦 Подготовка к деплою

### 1. Сборка проекта
```bash
npm run build
```

### 2. Результат сборки
После сборки в папке `dist/` будут готовые файлы для деплоя:
- `index.html` - главная страница
- `assets/` - стили, скрипты и изображения

## 🌐 Настройка для продакшн

### ✅ Что уже настроено:
- API вызовы идут напрямую к `api.binance.com` и `fapi.binance.com`
- Fallback на публичные CORS прокси при блокировке
- Оптимизированная сборка с разделением чанков
- Минификация и сжатие кода

### 🔧 Возможные настройки на сервере:

#### Nginx конфигурация:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/your/dist;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

#### Apache .htaccess:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

## 📁 Деплой файлов

### Способ 1: FTP/SFTP
```bash
# Копируем содержимое папки dist на сервер
scp -r dist/* user@server:/path/to/web/root/
```

### Способ 2: Git деплой
```bash
# На сервере
git clone https://github.com/terran666/trackista.live.git
cd trackista.live
npm install
npm run build
# Копируем dist в веб-папку
cp -r dist/* /var/www/html/
```

### Способ 3: Docker (опционально)
Создать Dockerfile:
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```

## 🔍 Проверка работы

После деплоя проверьте:
1. ✅ Страница загружается
2. ✅ Данные криптовалют отображаются
3. ✅ Графики работают
4. ✅ Переключение между спотом и фьючерсами
5. ✅ Мобильная версия корректна

## 🛠 Troubleshooting

### Если API не работает:
- Проверьте CORS политики вашего сервера
- Возможно потребуется настроить обратный прокси для API
- Используйте HTTPS для избежания mixed content

### Если графики не загружаются:
- Проверьте консоль браузера на ошибки
- Убедитесь что CDN klinecharts доступен
- Проверьте что WebSocket соединения разрешены

## 📊 Мониторинг

Рекомендуется настроить:
- Логирование ошибок JavaScript
- Мониторинг API запросов
- Аналитику использования

## 🔄 Обновление

Для обновления:
1. `git pull` (если используете Git)
2. `npm run build`
3. Копируете новые файлы из `dist/`
4. Очищаете кэш браузера пользователей
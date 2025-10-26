# 🚀 Настройка GitHub Actions для деплоя на сервер

## 🔧 Настройка GitHub Secrets

Зайдите в настройки репозитория:
**https://github.com/terran666/trackista.live/settings/secrets/actions**

## 📊 Для деплоя на S3 (как было раньше):

Добавьте следующие secrets:

```
AWS_ROLE_ARN = arn:aws:iam::YOUR_ACCOUNT:role/GitHubDeployer
AWS_DEFAULT_REGION = us-east-1 (или ваш регион)
S3_BUCKET_NAME = trackista.live (имя вашего S3 bucket)
```

## 🌐 Для деплоя на обычный сервер:

Замените содержимое файла `.github/workflows/deploy.yml` на:

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@v4.3.5
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./dist/
        server-dir: /public_html/
```

И добавьте secrets:
```
FTP_SERVER = ftp.your-domain.com
FTP_USERNAME = your-username
FTP_PASSWORD = your-password
```

## 🔐 Для SSH деплоя:

```yaml
    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        port: 22
        script: |
          cd /var/www/html
          git pull origin main
          npm ci
          npm run build
          cp -r dist/* .
```

И добавьте secrets:
```
SSH_HOST = your-server-ip
SSH_USER = your-username
SSH_PRIVATE_KEY = ваш-приватный-ssh-ключ
```

## ⚡ Активация

После настройки secrets:

1. **Коммитим изменения:**
```bash
git add .
git commit -m "🚀 Update deployment config"
git push origin main
```

2. **Деплой запустится автоматически** при каждом push в main

3. **Проверяем в Actions tab:** https://github.com/terran666/trackista.live/actions

## 🌐 Результат

После успешного деплоя:
- ✅ Сайт доступен на вашем домене
- ✅ Автоматическое обновление при каждом коммите
- ✅ Логи деплоя в GitHub Actions

**Какой способ деплоя вам нужен?**
- AWS S3 (как было раньше)
- FTP (обычный хостинг)
- SSH (VPS/сервер)
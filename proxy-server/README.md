# 🚀 Binance CORS Proxy Server

Прокси-сервер для обхода CORS ограничений Binance API.

## 📦 Установка зависимостей

```bash
cd proxy-server
npm install
```

## 🚀 Запуск сервера

```bash
npm start
```

Сервер запустится на `http://localhost:3001`

## 📊 Доступные эндпоинты

### Spot API
- **Base URL**: `http://localhost:3001/api/spot/`
- **Пример**: `http://localhost:3001/api/spot/klines?symbol=BTCUSDT&interval=1m&limit=10`

### Futures API  
- **Base URL**: `http://localhost:3001/api/futures/`
- **Пример**: `http://localhost:3001/api/futures/klines?symbol=BTCUSDT&interval=1m&limit=10`

## 🔧 Настройки

### Порт
По умолчанию используется порт `3001`. Для изменения отредактируйте `server.js`:
```javascript
const PORT = 3001; // измените на нужный порт
```

### CORS Origins
Разрешенные домены настраиваются в `server.js`:
```javascript
origin: ['http://localhost:5173', 'http://localhost:3000']
```

## 🌐 Поддерживаемые API

- ✅ Binance Spot API (`api.binance.com`)
- ✅ Binance USDT-M Futures API (`fapi.binance.com`)

## 📋 Логи

Сервер выводит информацию о запросах и ошибках в консоль.

## 🛑 Остановка

Нажмите `Ctrl+C` для остановки сервера.
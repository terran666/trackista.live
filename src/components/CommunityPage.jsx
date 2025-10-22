import React, { useState, useRef, useEffect } from 'react';

export default function CommunityPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: 'SharkBot',
      text: 'Добро пожаловать в сообщество SharkChunk! 🦈',
      timestamp: new Date(Date.now() - 60000),
      isSystem: true
    },
    {
      id: 2,
      user: 'CryptoTrader',
      text: 'Привет всем! Кто-нибудь видел движение по BTC?',
      timestamp: new Date(Date.now() - 30000),
      isSystem: false
    },
    {
      id: 3,
      user: 'MarketAnalyst',
      text: 'BTC показывает хорошую поддержку на $67k',
      timestamp: new Date(Date.now() - 15000),
      isSystem: false,
      image: null
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('Гость');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Отправка сообщения
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' && !selectedImage) return;

    const message = {
      id: messages.length + 1,
      user: currentUser,
      text: newMessage.trim(),
      timestamp: new Date(),
      isSystem: false,
      image: imagePreview
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Обработка выбора изображения
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Удаление выбранного изображения
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Форматирование времени
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="container-fluid p-0" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="row g-0 h-100">
        {/* Боковая панель с участниками */}
        <div className="col-lg-3 border-end bg-light">
          <div className="p-3 border-bottom bg-white">
            <h5 className="mb-0">👥 Сообщество</h5>
            <small className="text-muted">Общение трейдеров</small>
          </div>
          
          {/* Профиль пользователя */}
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center mb-3">
              <div 
                className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
                style={{ width: '40px', height: '40px' }}
              >
                <span className="text-white fw-bold">
                  {currentUser.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
            </div>
          </div>

          {/* Список участников онлайн */}
          <div className="p-3">
            <h6 className="text-muted mb-3">Онлайн (3)</h6>
            <div className="d-flex align-items-center mb-2">
              <div className="rounded-circle bg-success me-2" style={{ width: '8px', height: '8px' }}></div>
              <small>CryptoTrader</small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="rounded-circle bg-success me-2" style={{ width: '8px', height: '8px' }}></div>
              <small>MarketAnalyst</small>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="rounded-circle bg-success me-2" style={{ width: '8px', height: '8px' }}></div>
              <small>{currentUser}</small>
            </div>
          </div>

          {/* Правила сообщества */}
          <div className="p-3 border-top mt-auto">
            <h6 className="text-muted mb-2">📋 Правила</h6>
            <small className="text-muted">
              • Будьте вежливы<br/>
              • Обсуждайте только криптовалюты<br/>
              • Не спамьте<br/>
              • Делитесь полезной информацией
            </small>
          </div>
        </div>

        {/* Основная область чата */}
        <div className="col-lg-9 d-flex flex-column">
          {/* Заголовок чата */}
          <div className="p-3 border-bottom bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">💬 Общий чат</h5>
                <small className="text-muted">Обсуждение рынка криптовалют</small>
              </div>
              <div>
                <span className="badge bg-success">Онлайн</span>
              </div>
            </div>
          </div>

          {/* Область сообщений */}
          <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
            {messages.map((message) => (
              <div key={message.id} className={`mb-3 ${message.isSystem ? 'text-center' : ''}`}>
                {message.isSystem ? (
                  <div className="badge bg-info">{message.text}</div>
                ) : (
                  <div className={`d-flex ${message.user === currentUser ? 'justify-content-end' : ''}`}>
                    <div 
                      className={`card ${message.user === currentUser ? 'bg-primary text-white' : 'bg-white'}`}
                      style={{ maxWidth: '70%' }}
                    >
                      <div className="card-body p-2">
                        {message.user !== currentUser && (
                          <div className="d-flex align-items-center mb-1">
                            <div 
                              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                              style={{ width: '24px', height: '24px' }}
                            >
                              <small className="text-white fw-bold">
                                {message.user.charAt(0).toUpperCase()}
                              </small>
                            </div>
                            <small className="fw-bold">{message.user}</small>
                          </div>
                        )}
                        
                        {message.image && (
                          <div className="mb-2">
                            <img 
                              src={message.image} 
                              alt="Shared image" 
                              className="img-fluid rounded"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                        
                        {message.text && (
                          <div className="mb-1">{message.text}</div>
                        )}
                        
                        <small className={message.user === currentUser ? 'text-white-50' : 'text-muted'}>
                          {formatTime(message.timestamp)}
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Форма отправки сообщения */}
          <div className="p-3 border-top bg-white">
            {/* Превью изображения */}
            {imagePreview && (
              <div className="mb-2">
                <div className="position-relative d-inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="img-thumbnail"
                    style={{ maxHeight: '100px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0"
                    style={{ transform: 'translate(50%, -50%)' }}
                    onClick={removeImage}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Напишите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                
                {/* Кнопка выбора изображения */}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  title="Добавить изображение"
                >
                  📷
                </button>
                
                {/* Скрытый input для файлов */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="d-none"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                
                {/* Кнопка отправки */}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={newMessage.trim() === '' && !selectedImage}
                >
                  📤 Отправить
                </button>
              </div>
            </form>
            
            <small className="text-muted mt-1 d-block">
              Поддерживаются изображения JPG, PNG, GIF
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
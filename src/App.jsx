import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';
import logo from './components/img/logo.png';
import ScreenerPage from './components/ScreenerPage';
import ChartPage from './components/ChartPage';
import DensityPage from './components/DensityPage';
import CommunityPage from './components/CommunityPage';

export default function App(){
  const [currentPage, setCurrentPage] = useState('charts');
  
  // Функция для закрытия мобильного меню
  const closeMobileMenu = () => {
    const navbarCollapse = document.querySelector('#navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      const bsCollapse = new window.bootstrap.Collapse(navbarCollapse, {
        toggle: false
      });
      bsCollapse.hide();
    }
  };
  
  // Функция для переключения страницы и закрытия меню
  const handlePageChange = (page) => {
    console.log(`Переключение на страницу: ${page}`);
    setCurrentPage(page);
    closeMobileMenu();
  };
  
  // Отладочная информация
  console.log('Текущая страница:', currentPage);
  
  return (
    <div className="app-container">
      {/* Навигационное меню */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container-fluid">
          <a 
            className="navbar-brand d-flex align-items-center" 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange('charts');
            }}
            style={{ cursor: 'pointer' }}
          >
            <img src={logo} alt="Trackista" width="60" height="60" className="me-3"/>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Trackista</span>
          </a>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none ${currentPage === 'charts' ? 'active text-warning' : 'text-white'}`}
                  onClick={() => handlePageChange('charts')}
                >
                  Графики
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none ${currentPage === 'screener' ? 'active text-warning' : 'text-white'}`}
                  onClick={() => handlePageChange('screener')}
                >
                  Скринер
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none ${currentPage === 'density' ? 'active text-warning' : 'text-white'}`}
                  onClick={() => handlePageChange('density')}
                >
                  Плотность
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none ${currentPage === 'community' ? 'active text-warning' : 'text-white'}`}
                  onClick={() => handlePageChange('community')}
                >
                  Сообщество
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-decoration-none ${currentPage === 'signals' ? 'active text-warning' : 'text-white'}`}
                  onClick={() => handlePageChange('signals')}
                >
                  Сигналы
                </button>
              </li>
            </ul>
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="#">Login</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <div style={{ paddingTop: '80px' }}>
        {currentPage === 'charts' && <ChartPage />}
        {currentPage === 'screener' && <ScreenerPage />}
        {currentPage === 'density' && <DensityPage />}
        {currentPage === 'community' && <CommunityPage />}
        {currentPage === 'signals' && <CommunityPage />}
      </div>
    </div>
  );
}

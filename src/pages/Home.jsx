import React from 'react';
import { Link } from 'react-router-dom';
import { MdAddCircleOutline, MdUploadFile, MdLibraryBooks } from 'react-icons/md';
import './Home.css';
import StudySummary from '../components/StudySummary';

const Home = () => {

  const features = [
    {
      title: '新增單字',
      description: '手動新增一個新的單字到你的個人單字庫。',
      icon: <MdAddCircleOutline size={40} className="feature-icon" />,
      path: '/add',
      color: 'blue'
    },
    {
      title: '匯入 CSV',
      description: '使用 CSV 檔案快速匯入大量單字。',
      icon: <MdUploadFile size={40} className="feature-icon" />,
      path: '/import',
      color: 'green'
    },
    {
      title: '我的單字庫',
      description: '瀏覽、編輯並管理你所有已儲存的單字。',
      icon: <MdLibraryBooks size={40} className="feature-icon" />,
      path: '/list',
      color: 'purple'
    }
  ];

  return (
    <div className="home-container">
      <header className="page-header home-header">
        <div>
          <h1 className="welcome-text">歡迎回來，學習者！👋</h1>
          <p className="subtitle">準備好今天擴充你的英文單字量了嗎？</p>
        </div>
      </header>

      <section className="features-grid">
        {features.map((feature) => (
          <Link to={feature.path} key={feature.title} className={`feature-card ${feature.color}`}>
            <div className="icon-wrapper">
              {feature.icon}
            </div>
            <div className="feature-content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </Link>
        ))}
      </section>

      <StudySummary />
    </div>
  );
};

export default Home;

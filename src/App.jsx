import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddWord from './pages/AddWord';
import MyVocabulary from './pages/MyVocabulary';
import ImportCSV from './pages/ImportCSV';
import Settings from './pages/Settings';
import CardStudy from './pages/CardStudy';
import { useTheme } from './hooks/useTheme';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  useTheme(); // Initialize theme on app load

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="add" element={<AddWord />} />
          <Route path="list" element={<MyVocabulary />} />
          <Route path="import" element={<ImportCSV />} />

          <Route path="study" element={<CardStudy />} />
          <Route path="settings" element={<Settings />} />
          {/* Future routes will go here (Study, etc.) */}
        </Route>
      </Routes>
      <OfflineIndicator />
    </>
  );
}

export default App;

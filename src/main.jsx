import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Landing from './Landing.jsx'
import { getDefaultLang } from './i18n.js'
import './index.css'

function Root() {
  const [view, setView] = useState(() => {
    return localStorage.getItem('vampire_visited') ? 'app' : 'landing';
  });
  const [lang] = useState(getDefaultLang);

  const enterApp = () => {
    localStorage.setItem('vampire_visited', 'true');
    setView('app');
  };

  if (view === 'landing') {
    return <Landing onEnterApp={enterApp} lang={lang} />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)

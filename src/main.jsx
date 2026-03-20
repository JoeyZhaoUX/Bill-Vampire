import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Landing from './Landing.jsx'
import Legal from './Legal.jsx'
import { getDefaultLang } from './i18n.js'
import { checkPaymentSuccess } from './pro.js'
import './index.css'

function Root() {
  const [view, setView] = useState(() => {
    // Check for payment success callback from Creem.io
    if (checkPaymentSuccess()) {
      localStorage.setItem('vampire_visited', 'true');
      return 'app';
    }
    const hash = window.location.hash.replace('#', '');
    if (['terms', 'privacy', 'refund'].includes(hash)) return hash;
    return localStorage.getItem('vampire_visited') ? 'app' : 'landing';
  });
  const [lang, setLang] = useState(getDefaultLang);

  const enterApp = () => {
    localStorage.setItem('vampire_visited', 'true');
    window.location.hash = '';
    setView('app');
  };

  const goToLegal = (page) => {
    window.location.hash = page;
    window.scrollTo(0, 0);
    setView(page);
  };

  const goBack = (nextPage) => {
    if (nextPage && ['terms', 'privacy', 'refund'].includes(nextPage)) {
      goToLegal(nextPage);
    } else {
      window.location.hash = '';
      setView(localStorage.getItem('vampire_visited') ? 'app' : 'landing');
    }
  };

  if (['terms', 'privacy', 'refund'].includes(view)) {
    return <Legal page={view} onBack={goBack} />;
  }

  if (view === 'landing') {
    return <Landing onEnterApp={enterApp} onLegal={goToLegal} lang={lang} setLang={setLang} />;
  }
  return <App onLegal={goToLegal} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)

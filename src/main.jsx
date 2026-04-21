import React, { useState, useEffect, Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Landing from './Landing.jsx'
import Legal from './Legal.jsx'
import { getDefaultLang } from './i18n.js'
import { checkPaymentSuccess } from './pro.js'
import { track } from './analytics.js'
import './index.css'

const Scan = lazy(() => import('./onboarding/Scan.jsx'));
const Verdict = lazy(() => import('./onboarding/Verdict.jsx'));
const Commit = lazy(() => import('./onboarding/Commit.jsx'));
const Patrol = lazy(() => import('./pages/Patrol.jsx'));

const VALID_LEGAL = ['terms', 'privacy', 'refund'];
const VALID_ONBOARDING = ['scan', 'verdict', 'commit'];
const VALID_PAGES = ['patrol'];

function loadSubsFromStorage() {
  try {
    const raw = localStorage.getItem('vampire_subs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSubsToStorage(subs) {
  try {
    localStorage.setItem('vampire_subs', JSON.stringify(subs));
  } catch {}
}

function Root() {
  const [view, setView] = useState(() => {
    if (checkPaymentSuccess()) {
      localStorage.setItem('vampire_visited', 'true');
      return 'app';
    }
    const hash = window.location.hash.replace('#', '');
    if (VALID_LEGAL.includes(hash)) return hash;
    if (VALID_ONBOARDING.includes(hash)) return hash;
    if (VALID_PAGES.includes(hash)) return hash;
    return localStorage.getItem('vampire_visited') ? 'app' : 'landing';
  });
  const [onboardingSubs, setOnboardingSubs] = useState(loadSubsFromStorage);
  const [lang, setLang] = useState(getDefaultLang);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (VALID_LEGAL.includes(hash)) setView(hash);
      else if (VALID_PAGES.includes(hash)) setView(hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const startOnboarding = () => {
    track('onboarding_started');
    window.location.hash = 'scan';
    setView('scan');
  };

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

  const goToLanding = () => {
    window.location.hash = '';
    window.scrollTo(0, 0);
    setView('landing');
  };

  const goBack = (nextPage) => {
    if (nextPage && VALID_LEGAL.includes(nextPage)) {
      goToLegal(nextPage);
      return;
    }
    window.location.hash = '';
    setView(localStorage.getItem('vampire_visited') ? 'app' : 'landing');
  };

  const handleScanComplete = (bills) => {
    const existing = loadSubsFromStorage();
    const merged = [...existing, ...bills];
    saveSubsToStorage(merged);
    setOnboardingSubs(merged);
    window.location.hash = 'verdict';
    setView('verdict');
    window.scrollTo(0, 0);
  };

  const handleScanSkipToManual = () => {
    localStorage.setItem('vampire_visited', 'true');
    window.location.hash = '';
    setView('app');
  };

  const handleVerdictContinue = () => {
    window.location.hash = 'commit';
    setView('commit');
    window.scrollTo(0, 0);
  };

  const handleVerdictShare = () => {
    localStorage.setItem('vampire_visited', 'true');
    localStorage.setItem('vampire_open_share', '1');
    window.location.hash = '';
    setView('app');
  };

  const handleCommitDone = ({ killedIds }) => {
    if (killedIds?.length) {
      try {
        const subs = loadSubsFromStorage();
        const remaining = subs.filter(s => !killedIds.includes(s.id));
        const killed = subs
          .filter(s => killedIds.includes(s.id))
          .map(s => {
            const price = parseFloat(s.price) || 0;
            const cycle = s.cycle === 'yearly' ? 'yearly' : 'monthly';
            const usd = cycle === 'yearly' ? price / 12 : price;
            return { name: s.name, monthlyUSD: usd, cancelledAt: Date.now() };
          });
        saveSubsToStorage(remaining);
        const existingCancelled = JSON.parse(localStorage.getItem('vampire_cancelled') || '[]');
        localStorage.setItem('vampire_cancelled', JSON.stringify([...existingCancelled, ...killed]));
      } catch {}
    }
    localStorage.setItem('vampire_visited', 'true');
    window.location.hash = '';
    setView('app');
  };

  if (VALID_LEGAL.includes(view)) {
    return <Legal page={view} onBack={goBack} />;
  }

  const loader = (
    <div className="min-h-screen bg-[#0B0B11] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (view === 'scan') {
    return (
      <Suspense fallback={loader}>
        <Scan onComplete={handleScanComplete} onSkipToManual={handleScanSkipToManual} />
      </Suspense>
    );
  }

  if (view === 'verdict') {
    return (
      <Suspense fallback={loader}>
        <Verdict
          subscriptions={onboardingSubs.length ? onboardingSubs : loadSubsFromStorage()}
          onContinue={handleVerdictContinue}
          onShare={handleVerdictShare}
        />
      </Suspense>
    );
  }

  if (view === 'patrol') {
    return (
      <Suspense fallback={loader}>
        <Patrol onEnterApp={enterApp} />
      </Suspense>
    );
  }

  if (view === 'commit') {
    return (
      <Suspense fallback={loader}>
        <Commit
          subscriptions={onboardingSubs.length ? onboardingSubs : loadSubsFromStorage()}
          onDone={handleCommitDone}
        />
      </Suspense>
    );
  }

  if (view === 'landing') {
    return <Landing onEnterApp={startOnboarding} onLegal={goToLegal} lang={lang} setLang={setLang} />;
  }
  return <App onLegal={goToLegal} onGoToLanding={goToLanding} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)

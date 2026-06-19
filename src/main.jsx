/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Landing from './Landing.jsx'
import Legal from './Legal.jsx'
import { getDefaultLang } from './i18n.js'
import { checkPaymentSuccess, checkPendingCheckoutAbandon } from './pro.js'
import { track } from './analytics.js'
import AuthModal from './AuthModal.jsx'
import UpdatePrompt from './UpdatePrompt.jsx'
import { getMe, syncLocalToCloud } from './auth.js'
import './index.css'

const Scan = lazy(() => import('./onboarding/Scan.jsx'));
const EmailGate = lazy(() => import('./onboarding/EmailGate.jsx'));
const Verdict = lazy(() => import('./onboarding/Verdict.jsx'));
const Commit = lazy(() => import('./onboarding/Commit.jsx'));
const Patrol = lazy(() => import('./pages/Patrol.jsx'));

const VALID_LEGAL = ['terms', 'privacy', 'refund'];
const VALID_ONBOARDING = ['scan', 'email-gate', 'verdict', 'commit'];
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
  } catch { /* localStorage may be unavailable */ }
}

function getHashValue() {
  if (typeof window === 'undefined') return '';
  return window.location.hash.replace(/^#/, '');
}

function getHashRoute() {
  return getHashValue().split('?')[0];
}

function getIntentParams(url) {
  const params = new URLSearchParams(url.search);
  const hash = url.hash.replace(/^#/, '');
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  if (hashQuery) {
    const hashParams = new URLSearchParams(hashQuery);
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  return params;
}

function normalizeIssueType(issue, service = '') {
  if (['surprise_charge', 'trial_ending', 'hard_cancel'].includes(issue)) return issue;
  if (['trial_refund', 'refund_denied', 'refund_request'].includes(issue)) return 'surprise_charge';
  return service ? 'hard_cancel' : 'surprise_charge';
}

function hydrateIntentFromUrl() {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  const params = getIntentParams(url);
  const service = (params.get('service') || '').trim();
  const amount = (params.get('amount') || '').trim();
  const renewal = (params.get('renewal') || '').trim();
  const issue = (params.get('issue') || '').trim();
  const source = (params.get('utm_source') || params.get('source') || '').trim();
  const prefill = (params.get('prefill') || '').trim();
  if (!service && !amount && !renewal && !issue && !source && !prefill) return false;

  const issueType = normalizeIssueType(issue, service);
  localStorage.setItem('vampire_issue_type', issueType);
  localStorage.setItem('vampire_source_page', JSON.stringify({
    path: url.pathname,
    source: source || (url.pathname.startsWith('/cancel/') ? 'seo_cancel_page' : 'direct_link'),
    service,
    amount,
    renewal,
    prefill: !!prefill,
    capturedAt: new Date().toISOString(),
  }));

  if (prefill) {
    localStorage.setItem('vampire_tool_prefill', prefill);
  } else if (service || amount || renewal) {
    const parts = [];
    if (service) parts.push(`Service: ${service}.`);
    if (amount) parts.push(`Charge amount: ${amount}.`);
    if (renewal) parts.push(`Renewal or charge date: ${renewal}.`);
    parts.push(issueType === 'surprise_charge'
      ? 'I was charged and want help cancelling and requesting a refund.'
      : issueType === 'trial_ending'
        ? 'My trial is ending soon and I want to cancel before renewal.'
        : 'I need help cancelling and documenting proof.');
    localStorage.setItem('vampire_tool_prefill', parts.join(' '));
  }
  track('intent_url_captured', { issue_type: issueType, service, source_page: url.pathname, source });
  return !!(service || amount || renewal || issue || prefill);
}

function Root() {
  const [view, setView] = useState(() => {
    const hasIntent = hydrateIntentFromUrl();
    const paymentSuccess = checkPaymentSuccess();
    if (paymentSuccess) {
      localStorage.setItem('vampire_visited', 'true');
      if (paymentSuccess === 'emergency_kit' && loadSubsFromStorage().length) return 'verdict';
      if (paymentSuccess === 'patrol' || paymentSuccess === 'patrol_annual') return 'patrol';
      return 'app';
    }
    const hash = getHashRoute();
    if (VALID_LEGAL.includes(hash)) return hash;
    if (VALID_ONBOARDING.includes(hash)) return hash;
    if (VALID_PAGES.includes(hash)) return hash;
    if (hasIntent) return 'scan';
    return localStorage.getItem('vampire_visited') ? 'app' : 'landing';
  });
  const [onboardingSubs, setOnboardingSubs] = useState(loadSubsFromStorage);
  const [lang, setLang] = useState(getDefaultLang);
  const [auth, setAuth] = useState({ status: 'checking', user: null, sync: 'idle', error: null });
  const [authModal, setAuthModal] = useState(null);
  const [authNotice, setAuthNotice] = useState('');

  const authErrorMessage = (error) => {
    const messages = {
      expired_token: 'That sign-in link expired. Send yourself a fresh magic link or continue with Google.',
      invalid_or_used_token: 'That sign-in link was already used or is invalid. Send a new one to continue.',
      missing_token: 'That sign-in link is missing its token. Please request a fresh link.',
      auth_unconfigured: 'Cloud login is not fully configured yet. You can keep using guest mode for now.',
      google_unconfigured: 'Google sign-in still needs its OAuth credentials. Use email magic link for now.',
      google_denied: 'Google sign-in was cancelled. You can try again or use email.',
      google_failed: 'Google sign-in failed. Try again or use email magic link.',
    };
    return messages[error] || 'Sign-in could not finish. Try again or request a new link.';
  };

  const refreshAuth = async (sync = true) => {
    try {
      const me = await getMe();
      if (!me.authenticated) {
        setAuth({ status: 'guest', user: null, sync: me.error === 'auth_unconfigured' ? 'unconfigured' : 'idle', error: me.error || null });
        return null;
      }
      setAuth({ status: 'authenticated', user: me.user, sync: sync ? 'syncing' : 'synced', error: null });
      if (sync) {
        const cloud = await syncLocalToCloud();
        setOnboardingSubs(loadSubsFromStorage());
        localStorage.removeItem('vampire_purchase_recovery_needed');
        localStorage.removeItem('vampire_purchase_recovery_prompted');
        setAuth({ status: 'authenticated', user: me.user, sync: 'synced', error: null, cloud });
      }
      return me.user;
    } catch (err) {
      setAuth({ status: 'guest', user: null, sync: err?.data?.error === 'auth_unconfigured' ? 'unconfigured' : 'paused', error: err?.data?.error || err.message });
      return null;
    }
  };

  useEffect(() => {
    const onHash = () => {
      const hash = getHashRoute();
      if (VALID_LEGAL.includes(hash)) setView(hash);
      else if (VALID_ONBOARDING.includes(hash)) setView(hash);
      else if (VALID_PAGES.includes(hash)) setView(hash);
      else if (hash === 'auth-success') {
        localStorage.setItem('vampire_visited', 'true');
        window.location.hash = '';
        setAuthModal(null);
        setAuthNotice('');
        queueMicrotask(() => refreshAuth(true));
        setView(loadSubsFromStorage().length ? 'app' : 'landing');
      } else if (hash.startsWith('auth-error=')) {
        const error = decodeURIComponent(hash.replace('auth-error=', ''));
        window.location.hash = '';
        setAuthNotice(authErrorMessage(error));
        setAuthModal('auth_error');
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const hash = getHashRoute();
    if (hash === 'auth-success') {
      localStorage.setItem('vampire_visited', 'true');
      window.location.hash = '';
    } else if (hash.startsWith('auth-error=')) {
      const error = decodeURIComponent(hash.replace('auth-error=', ''));
      window.location.hash = '';
      queueMicrotask(() => {
        setAuthNotice(authErrorMessage(error));
        setAuthModal('auth_error');
      });
    }
    queueMicrotask(() => refreshAuth(true));
  }, []);

  useEffect(() => {
    const onFocus = () => checkPendingCheckoutAbandon();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  useEffect(() => {
    if (auth.status !== 'guest') return;
    if (localStorage.getItem('vampire_purchase_recovery_needed') !== 'true') return;
    if (localStorage.getItem('vampire_purchase_recovery_prompted') === 'true') return;
    localStorage.setItem('vampire_purchase_recovery_prompted', 'true');
    queueMicrotask(() => {
      setAuthNotice('Emergency Kit unlocked locally. Sign in with the same email you used at Creem checkout to keep the purchase recoverable after cache clears.');
      setAuthModal('post_purchase_recovery');
    });
  }, [auth.status]);

  const startOnboarding = (source = 'default') => {
    const issueType = source === 'trial_ending' ? 'trial_ending'
      : source === 'hard_cancel' ? 'hard_cancel'
      : source === 'surprise_charge' ? 'surprise_charge'
      : localStorage.getItem('vampire_issue_type') || 'surprise_charge';
    localStorage.setItem('vampire_issue_type', issueType);
    track('onboarding_started', { source, issue_type: issueType });
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
    refreshAuth(false);
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

  const handleScanComplete = (bills, meta = {}) => {
    const existing = loadSubsFromStorage();
    const merged = [...existing, ...bills];
    saveSubsToStorage(merged);
    setOnboardingSubs(merged);
    if (meta.issueType) localStorage.setItem('vampire_issue_type', meta.issueType);
    if (meta.rawText) localStorage.setItem('vampire_last_raw_input', meta.rawText.slice(0, 4000));
    if (meta.sourcePage) localStorage.setItem('vampire_source_page', JSON.stringify(meta.sourcePage));
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
      } catch { /* ignore malformed local records */ }
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
      <>
        <Suspense fallback={loader}>
          <Scan onComplete={handleScanComplete} onSkipToManual={handleScanSkipToManual} />
        </Suspense>
        <AuthModal open={!!authModal} reason={authModal} initialMessage={authNotice} onClose={() => { setAuthModal(null); setAuthNotice(''); }} />
        <UpdatePrompt />
      </>
    );
  }

  if (view === 'email-gate') {
    const subs = onboardingSubs.length ? onboardingSubs : loadSubsFromStorage();
    return (
      <>
        <Suspense fallback={loader}>
          <EmailGate
            subscriptionCount={subs.length}
            onContinue={() => { window.location.hash = 'verdict'; setView('verdict'); window.scrollTo(0, 0); }}
            onSkip={() => { window.location.hash = 'verdict'; setView('verdict'); window.scrollTo(0, 0); }}
            onAuthRequest={(reason) => setAuthModal(reason || 'email_gate')}
          />
        </Suspense>
        <AuthModal open={!!authModal} reason={authModal} initialMessage={authNotice} onClose={() => { setAuthModal(null); setAuthNotice(''); }} />
        <UpdatePrompt />
      </>
    );
  }

  if (view === 'verdict') {
    return (
      <>
        <Suspense fallback={loader}>
          <Verdict
            subscriptions={onboardingSubs.length ? onboardingSubs : loadSubsFromStorage()}
            onContinue={handleVerdictContinue}
            onShare={handleVerdictShare}
            auth={auth}
            onAuthRequest={(reason) => setAuthModal(reason || 'save_case')}
            onAuthRefresh={() => refreshAuth(true)}
          />
        </Suspense>
        <AuthModal open={!!authModal} reason={authModal} initialMessage={authNotice} onClose={() => { setAuthModal(null); setAuthNotice(''); }} />
        <UpdatePrompt />
      </>
    );
  }

  if (view === 'patrol') {
    return (
      <>
        <Suspense fallback={loader}>
          <Patrol onEnterApp={enterApp} auth={auth} onAuthRequest={(reason) => setAuthModal(reason || 'patrol')} />
        </Suspense>
        <AuthModal open={!!authModal} reason={authModal} initialMessage={authNotice} onClose={() => { setAuthModal(null); setAuthNotice(''); }} />
        <UpdatePrompt />
      </>
    );
  }

  if (view === 'commit') {
    return (
      <>
        <Suspense fallback={loader}>
          <Commit
            subscriptions={onboardingSubs.length ? onboardingSubs : loadSubsFromStorage()}
            onDone={handleCommitDone}
            auth={auth}
            onAuthRequest={(reason) => setAuthModal(reason || 'commit')}
          />
        </Suspense>
        <AuthModal open={!!authModal} reason={authModal} onClose={() => setAuthModal(null)} />
        <UpdatePrompt />
      </>
    );
  }

  if (view === 'landing') {
    return (
      <>
        <Landing
          onEnterApp={startOnboarding}
          onOpenApp={enterApp}
          onLegal={goToLegal}
          lang={lang}
          setLang={setLang}
          auth={auth}
          onAuthRequest={(reason) => setAuthModal(reason || 'landing')}
        />
        <AuthModal open={!!authModal} reason={authModal} initialMessage={authNotice} onClose={() => { setAuthModal(null); setAuthNotice(''); }} />
        <UpdatePrompt />
      </>
    );
  }
  return (
    <>
      <App
        onLegal={goToLegal}
        onGoToLanding={goToLanding}
        auth={auth}
        onAuthRequest={(reason) => setAuthModal(reason || 'app')}
        onAuthRefresh={() => refreshAuth(true)}
      />
      <AuthModal open={!!authModal} reason={authModal} initialMessage={authNotice} onClose={() => { setAuthModal(null); setAuthNotice(''); }} />
      <UpdatePrompt />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)

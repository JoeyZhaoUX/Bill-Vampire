import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faXmark, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { getGoogleAuthUrl, startMagicLink } from './auth';
import { track } from './analytics';

export default function AuthModal({ open, reason = 'save', onClose, initialMessage = '' }) {
  const [email, setEmail] = useState(() => localStorage.getItem('vampire_email') || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState(initialMessage);
  const [magicLink, setMagicLink] = useState('');

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Enter a valid email address.');
      return;
    }
    setStatus('loading');
    setMessage('');
    setMagicLink('');
    try {
      const res = await startMagicLink(email, reason);
      localStorage.setItem('vampire_email', email.trim().toLowerCase());
      track('auth_magic_link_requested', { reason, email_sent: !!res.emailSent });
      setStatus('sent');
      setMessage(res.emailSent
        ? 'Check your email for a secure sign-in link. After you open it, this case file will sync.'
        : 'Magic link is ready. Email sending is not configured yet, so use this development link.');
      if (res.magicLink) setMagicLink(res.magicLink);
    } catch (err) {
      setStatus('idle');
      setMessage(err?.data?.error === 'auth_unconfigured'
        ? 'Cloud sync is not configured yet. You can keep using the app locally for now.'
        : 'Could not start sign-in right now. Try again in a minute.');
    }
  };

  const continueWithGoogle = () => {
    track('auth_google_clicked', { reason });
    window.location.href = getGoogleAuthUrl(reason);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6">
      <div className="bv-auth-modal w-full max-w-md rounded-3xl border border-white/10 bg-[#171217] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(201,164,106,0.1)] border border-[rgba(201,164,106,0.28)] flex items-center justify-center">
              <FontAwesomeIcon icon={faLock} className="w-4 h-4 text-[#C9A46A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F7EFE6]">Save your case file</p>
              <p className="text-[11px] text-[#A99A91]">No bank login. Email or Google sign-in.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-black/20 text-[#A99A91] hover:text-[#F7EFE6] cursor-pointer">
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5">
          <p className="text-sm text-[#CDBFB6] leading-relaxed mb-5">
            Create an account after results to keep subscriptions, reminders, and Emergency Kits safe when cache is cleared or you switch devices.
          </p>
          <button
            type="button"
            onClick={continueWithGoogle}
            className="w-full py-3.5 rounded-2xl bg-[#F7EFE6] text-[#171217] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mb-3 hover:bg-white transition-colors"
          >
            <FontAwesomeIcon icon={faGoogle} className="w-4 h-4" />
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#6f625c]">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <label className="block text-[10px] font-bold uppercase text-[#C9A46A] mb-2">Email</label>
          <div className="relative mb-3">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A99A91]" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0D0B0E] border border-white/10 text-sm text-[#F7EFE6] placeholder:text-[#6f625c] outline-none focus:border-[#C9A46A]/50"
              autoFocus
            />
          </div>
          {message && (
            <p className={`text-xs leading-relaxed mb-4 ${status === 'sent' ? 'text-[#88C7A2]' : 'text-[#D58A91]'}`}>
              {message}
            </p>
          )}
          {magicLink && (
            <a href={magicLink} className="block text-xs text-[#C9A46A] underline mb-4 break-all">
              Open development magic link
            </a>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 rounded-2xl bg-[#8E1D2C] text-[#F7EFE6] text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {status === 'loading' ? 'Sending secure link…' : 'Send magic link'}
            {status !== 'loading' && <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const { user, login, logout } = useAuth();

  useEffect(() => {
    // Animate Header entrance
    const ctx = gsap.context(() => {
      gsap.to('.header-elem', { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 1.2 });
    }, headerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <header ref={headerRef} className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 mix-blend-difference text-[#EDEDED] font-sans text-sm tracking-widest uppercase pointer-events-none">
      <div className="flex items-center gap-4 header-elem opacity-0 translate-y-[-20px] pointer-events-auto">
        <Link href="/" className="text-2xl font-bold tracking-tighter">MANTIS</Link>
      </div>
      <nav className="header-elem opacity-0 translate-y-[-20px] pointer-events-auto">
        <ul className="flex items-center gap-8">
          <li><Link href="/implement" className="hover:text-brand-orange transition-colors">Implement</Link></li>
          <li><Link href="/source" className="hover:text-brand-orange transition-colors">Source Code</Link></li>
          <li><Link href="/dashboard" className="hover:text-brand-orange transition-colors">Dashboard</Link></li>
          <li className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={logout} className="hover:text-brand-orange transition-colors">Logout</button>
              </div>
            ) : (
              <LoginButton onLogin={login} />
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}

function LoginButton({ onLogin }: { onLogin: (data: any) => void }) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      // The implicit flow gives an access_token, we can fetch user profile
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const payload = await res.json();
        onLogin({
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        });
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    },
    onError: () => console.error('Login Failed'),
  });

  return (
    <button onClick={() => login()} className="hover:text-brand-orange transition-colors">
      Login
    </button>
  );
}

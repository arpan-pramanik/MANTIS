'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserProfile = {
  name: string;
  email: string;
  picture?: string;
  isSubscribed?: boolean;
};

interface AuthContextType {
  user: UserProfile | null;
  login: (tokenOrUser: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const cachedUser = localStorage.getItem('mantis_user');
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);

        // Background sync to ensure cross-device consistency
        if (parsedUser.email) {
          fetch('/api/user/me', { headers: { 'x-user-email': parsedUser.email } })
            .then(res => res.ok ? res.json() : null)
            .then(dbData => {
              if (dbData && dbData.user) {
                const isPremium = dbData.user.isSubscribed || parsedUser.email.toLowerCase() === 'arpanpramanik015@gmail.com';
                const updatedUser = { ...parsedUser, isSubscribed: isPremium };
                // Only update state/cache if it actually changed to prevent unnecessary renders
                if (updatedUser.isSubscribed !== parsedUser.isSubscribed) {
                  setUser(updatedUser);
                  localStorage.setItem('mantis_user', JSON.stringify(updatedUser));
                }
              }
            })
            .catch(e => console.error("Background sync failed", e));
        }
      } catch (e) {
        console.error("Failed to parse cached user");
      }
    }
  }, []);

  const login = async (data: any) => {
    let userData: UserProfile;
    if (data.credential) {
      const base64Url = data.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      userData = { name: payload.name, email: payload.email, picture: payload.picture };
    } else {
      userData = data;
    }
    
    try {
      const res = await fetch('/api/user/me', {
        headers: { 'x-user-email': userData.email }
      });
      if (res.ok) {
        const dbData = await res.json();
        userData.isSubscribed = dbData.user.isSubscribed || userData.email.toLowerCase() === 'arpanpramanik015@gmail.com';
      } else {
        userData.isSubscribed = userData.email.toLowerCase() === 'arpanpramanik015@gmail.com';
      }
    } catch(e) {
      console.error("Failed to fetch user subscription status", e);
      userData.isSubscribed = userData.email.toLowerCase() === 'arpanpramanik015@gmail.com';
    }

    setUser(userData);
    localStorage.setItem('mantis_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mantis_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

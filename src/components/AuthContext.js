import React, { useContext, useState, useEffect } from 'react';
import { auth } from './firebase';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Firebase auth is properly initialized
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // Mock user for development
      setLoading(false);
      return () => {};
    }
  }, []);

  const value = {
    currentUser,
    // Mock signup function for development
    signup: (email, password) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = { 
            uid: 'mock-user-id', 
            email, 
            emailVerified: false,
            updateProfile: () => Promise.resolve()
          };
          setCurrentUser(mockUser);
          resolve({ user: mockUser });
        }, 1000);
      });
    },
    // Mock login function for development
    login: (email, password) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = { 
            uid: 'mock-user-id', 
            email, 
            emailVerified: false 
          };
          setCurrentUser(mockUser);
          resolve({ user: mockUser });
        }, 1000);
      });
    },
    // Mock logout function for development
    logout: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setCurrentUser(null);
          resolve();
        }, 500);
      });
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
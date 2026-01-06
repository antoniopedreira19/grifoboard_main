import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface UseSessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export const useSessionTimeout = ({ 
  timeoutMinutes = 30, 
  warningMinutes = 5 
}: UseSessionTimeoutProps = {}) => {
  const { userSession, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (!userSession.user) return;

    lastActivityRef.current = Date.now();
    localStorage.setItem('last_activity', lastActivityRef.current.toString());

    // No automatic logout or warning — only track activity per user's request
  };

  useEffect(() => {
    if (!userSession.user) {
      // Clear timeouts if user is not logged in
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Initial setup
    resetTimeout();

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Remove visibility change listener to prevent layout shifts on tab focus

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [userSession.user, signOut, timeoutMinutes, warningMinutes]);

  // Public API
  return {
    resetTimeout,
    lastActivity: lastActivityRef.current,
  };
};
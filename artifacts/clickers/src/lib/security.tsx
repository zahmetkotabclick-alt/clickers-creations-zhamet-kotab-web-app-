import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute: Physically blocks unauthorized access to Admin pages.
 * Redirects non-admins to the login page or homepage.
 *
 * FIX: setLocation() must NEVER be called during the render phase — that
 * triggers React error #426 ("state update during render"). All navigation
 * side-effects are now safely moved into a useEffect.
 */
export function ProtectedRoute({ children, adminOnly = true }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return; // Wait until auth is fully resolved

    if (!user) {
      setLocation('/auth');
      return;
    }

    if (adminOnly && !isAdmin) {
      setLocation('/');
    }
  }, [isLoading, user, isAdmin, adminOnly, setLocation]);

  // Show spinner while auth state is being resolved
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // While the useEffect redirect hasn't fired yet, render nothing (no flash)
  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * sanitizeHTML: A lightweight defense-in-depth sanitizer.
 * Removes <script>, onAttributes, and other XSS vectors.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc)
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/\s+on\w+=[^\s>]+/gi, '')
    // Remove javascript: pseudo-protocol
    .replace(/javascript:/gi, '[removed]')
    // Remove iframe/object/embed/base
    .replace(/<(?:iframe|object|embed|base)\b[^>]*>/gi, '')
    .replace(/<\/(?:iframe|object|embed|base)>/gi, '');
}

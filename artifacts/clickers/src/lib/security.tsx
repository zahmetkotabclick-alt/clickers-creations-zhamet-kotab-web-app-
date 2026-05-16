import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute: Physically blocks unauthorized access to Admin pages.
 * Redirects non-admins to the login page or homepage.
 */
export function ProtectedRoute({ children, adminOnly = true }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation('/auth');
    return null;
  }

  if (adminOnly && !isAdmin) {
    setLocation('/');
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

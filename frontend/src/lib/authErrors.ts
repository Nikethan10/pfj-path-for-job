/**
 * Translate Firebase Auth error codes into messages a person can act on.
 * Raw SDK errors look like "Firebase: Error (auth/invalid-credential)." —
 * never show those to users.
 */
const MESSAGES: Record<string, string> = {
  // Sign-in: Firebase reports wrong password and unknown email with the same
  // code (email-enumeration protection), so the message covers both.
  'auth/invalid-credential': "No account matches that email and password. If you're new, create an account below.",
  'auth/wrong-password': "No account matches that email and password. If you're new, create an account below.",
  'auth/user-not-found': "No account matches that email and password. If you're new, create an account below.",
  'auth/invalid-email': "That email address doesn't look valid. Please check it and try again.",
  'auth/user-disabled': 'This account has been suspended. Contact support if you think this is a mistake.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/network-request-failed': 'Network error — check your internet connection and try again.',

  // Sign-up
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Password is too weak — use at least 6 characters.',

  // Google popup
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
  'auth/cancelled-popup-request': 'Sign-in was interrupted. Please try again.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a different sign-in method. Try "Continue with Google" or your original method.',
};

export function authErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return fallback;
}

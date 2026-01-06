/**
 * Utility to handle auth redirects based on URL hash
 */
export const handleAuthRedirect = () => {
  const hash = window.location.hash;
  
  // Check if this is a password reset link (success or error)
  if (hash.includes('type=recovery') || 
      hash.includes('error_code=otp_expired') || 
      hash.includes('error_description=Email+link+is+invalid') ||
      (hash.includes('error=access_denied') && window.location.pathname.includes('reset-password'))) {
    // Keep the hash for error handling and redirect to reset password page
    window.location.href = '/reset-password' + hash;
    return true;
  }
  
  return false;
};
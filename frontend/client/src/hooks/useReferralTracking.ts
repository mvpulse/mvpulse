import { useState, useEffect } from "react";

const REFERRAL_STORAGE_KEY = "mvpulse_referral_code";

/**
 * Hook to detect and store referral code from URL
 * Used at app initialization to capture ?ref= parameter
 */
export function useReferralTracking() {
  const [storedReferralCode, setStoredReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check URL for ?ref= parameter
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    if (refCode) {
      // Store in localStorage
      localStorage.setItem(REFERRAL_STORAGE_KEY, refCode.toUpperCase());
      setStoredReferralCode(refCode.toUpperCase());

      // Clean URL (remove ?ref= parameter while preserving other params)
      urlParams.delete("ref");
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
    } else {
      // Check localStorage for existing code
      const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (stored) {
        setStoredReferralCode(stored);
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * Clear the stored referral code (call after successful tracking)
   */
  const clearReferralCode = () => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    setStoredReferralCode(null);
  };

  /**
   * Check if there's a pending referral code
   */
  const hasPendingReferral = storedReferralCode !== null;

  return {
    storedReferralCode,
    hasPendingReferral,
    clearReferralCode,
    isLoading,
  };
}

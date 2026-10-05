import { useCallback } from "react";

export const useClearStorage = () => {
  const clearAppSession = useCallback(() => {
    try {
      // 1. Remove specific known keys first
      localStorage.removeItem("approval_admin_token");

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("approval_")) {
          localStorage.removeItem(key);
        }
      });

      console.log("App session cleared from LocalStorage.");
    } catch (error) {
      console.error("Failed to clear storage", error);
    }
  }, []);

  return { clearAppSession };
};

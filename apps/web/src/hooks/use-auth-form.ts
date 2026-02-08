import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export type AuthFormState = "idle" | "loading" | "success" | "error";

interface UseAuthFormReturn {
  formState: AuthFormState;
  error: string | null;
  fieldErrors: Record<string, string>;
  isLoading: boolean;
  setLoading: () => void;
  setSuccess: (message?: string, redirectTo?: string, delay?: number) => void;
  setError: (error: string | Record<string, string>) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  reset: () => void;
}

export function useAuthForm(): UseAuthFormReturn {
  const [formState, setFormState] = useState<AuthFormState>("idle");
  const [error, setErrorState] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const setLoading = useCallback(() => {
    setFormState("loading");
    setErrorState(null);
    setFieldErrors({});
  }, []);

  const setSuccess = useCallback(
    (message?: string, redirectTo?: string, delay: number = 2000) => {
      setFormState("success");
      setErrorState(null);
      setFieldErrors({});

      if (message) {
        toast.success(message);
      }

      if (redirectTo) {
        setTimeout(() => {
          navigate({ to: redirectTo as any });
        }, delay);
      }
    },
    [navigate]
  );

  const setError = useCallback((error: string | Record<string, string>) => {
    setFormState("error");

    if (typeof error === "string") {
      setErrorState(error);
      toast.error(error);
    } else {
      // Handle field-level errors
      setFieldErrors(error);
      // Show first error in toast
      const firstError = Object.values(error)[0];
      if (firstError) {
        toast.error(firstError);
      }
    }
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const reset = useCallback(() => {
    setFormState("idle");
    setErrorState(null);
    setFieldErrors({});
  }, []);

  return {
    formState,
    error,
    fieldErrors,
    isLoading: formState === "loading",
    setLoading,
    setSuccess,
    setError,
    setFieldError,
    clearFieldError,
    reset,
  };
}

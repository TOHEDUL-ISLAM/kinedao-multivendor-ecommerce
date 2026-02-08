import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BusinessInfoInput,
  AddressInput,
  DocumentsInput,
  PaymentInput,
} from "@kineDao.com/api-types/vendor";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface VendorApplicationStore {
  // Current wizard step
  currentStep: WizardStep;

  // Step data
  businessInfo: Partial<BusinessInfoInput>;
  address: Partial<AddressInput>;
  documents: Partial<DocumentsInput>;
  payment: Partial<PaymentInput>;

  // Track which steps are completed
  completedSteps: number[];

  // Form state
  isSubmitting: boolean;

  // Actions
  setCurrentStep: (step: WizardStep) => void;
  setBusinessInfo: (data: Partial<BusinessInfoInput>) => void;
  setAddress: (data: Partial<AddressInput>) => void;
  setDocuments: (data: Partial<DocumentsInput>) => void;
  setPayment: (data: Partial<PaymentInput>) => void;
  markStepCompleted: (step: WizardStep) => void;
  setIsSubmitting: (value: boolean) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canNavigateTo: (step: WizardStep) => boolean;
  reset: () => void;
}

const initialState = {
  currentStep: 1 as WizardStep,
  businessInfo: {},
  address: {},
  documents: {},
  payment: {},
  completedSteps: [],
  isSubmitting: false,
};

export const useVendorApplicationStore = create<VendorApplicationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      setBusinessInfo: (data) => {
        set({ businessInfo: { ...get().businessInfo, ...data } });
      },

      setAddress: (data) => {
        set({ address: { ...get().address, ...data } });
      },

      setDocuments: (data) => {
        set({ documents: { ...get().documents, ...data } });
      },

      setPayment: (data) => {
        set({ payment: { ...get().payment, ...data } });
      },

      markStepCompleted: (step) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }
      },

      setIsSubmitting: (value) => {
        set({ isSubmitting: value });
      },

      goToNextStep: () => {
        const { currentStep } = get();
        if (currentStep < 5) {
          set({ currentStep: (currentStep + 1) as WizardStep });
        }
      },

      goToPreviousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as WizardStep });
        }
      },

      canNavigateTo: (step) => {
        const { completedSteps, currentStep } = get();
        // Can always go back to completed steps or current step
        if (step <= currentStep) return true;
        // Can only go forward if previous steps are completed
        for (let i = 1; i < step; i++) {
          if (!completedSteps.includes(i)) return false;
        }
        return true;
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "kinedao-vendor-application",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        currentStep: state.currentStep,
        businessInfo: state.businessInfo,
        address: state.address,
        documents: state.documents,
        payment: state.payment,
        completedSteps: state.completedSteps,
      }),
    }
  )
);

// Selector hooks for convenience
export const useCurrentStep = () => useVendorApplicationStore((s) => s.currentStep);
export const useBusinessInfo = () => useVendorApplicationStore((s) => s.businessInfo);
export const useAddressInfo = () => useVendorApplicationStore((s) => s.address);
export const useDocumentsInfo = () => useVendorApplicationStore((s) => s.documents);
export const usePaymentInfo = () => useVendorApplicationStore((s) => s.payment);
export const useCompletedSteps = () => useVendorApplicationStore((s) => s.completedSteps);
export const useIsSubmitting = () => useVendorApplicationStore((s) => s.isSubmitting);

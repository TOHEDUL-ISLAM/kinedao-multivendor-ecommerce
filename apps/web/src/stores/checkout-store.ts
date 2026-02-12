import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
	ShippingAddressDTO,
	ShippingCostDTO,
} from "@kineDao.com/api-types/checkout";

export type CheckoutStep = 1 | 2 | 3;

interface CheckoutStore {
	// Current step
	currentStep: CheckoutStep;

	// Step data
	selectedAddressId: string | null;
	selectedAddress: ShippingAddressDTO | null;
	shippingCost: ShippingCostDTO | null;
	customerNotes: string;
	acceptedTerms: boolean;

	// Track completed steps
	completedSteps: number[];

	// Order placement state
	isPlacingOrder: boolean;

	// Actions
	setCurrentStep: (step: CheckoutStep) => void;
	setSelectedAddress: (address: ShippingAddressDTO) => void;
	setShippingCost: (cost: ShippingCostDTO) => void;
	setCustomerNotes: (notes: string) => void;
	setAcceptedTerms: (accepted: boolean) => void;
	markStepCompleted: (step: CheckoutStep) => void;
	setIsPlacingOrder: (value: boolean) => void;
	goToNextStep: () => void;
	goToPreviousStep: () => void;
	canNavigateTo: (step: CheckoutStep) => boolean;
	reset: () => void;
}

const initialState = {
	currentStep: 1 as CheckoutStep,
	selectedAddressId: null,
	selectedAddress: null,
	shippingCost: null,
	customerNotes: "",
	acceptedTerms: false,
	completedSteps: [],
	isPlacingOrder: false,
};

export const useCheckoutStore = create<CheckoutStore>()(
	persist(
		(set, get) => ({
			...initialState,

			setCurrentStep: (step) => {
				set({ currentStep: step });
			},

			setSelectedAddress: (address) => {
				set({
					selectedAddress: address,
					selectedAddressId: address.id,
				});
			},

			setShippingCost: (cost) => {
				set({ shippingCost: cost });
			},

			setCustomerNotes: (notes) => {
				set({ customerNotes: notes });
			},

			setAcceptedTerms: (accepted) => {
				set({ acceptedTerms: accepted });
			},

			markStepCompleted: (step) => {
				const { completedSteps } = get();
				if (!completedSteps.includes(step)) {
					set({ completedSteps: [...completedSteps, step] });
				}
			},

			setIsPlacingOrder: (value) => {
				set({ isPlacingOrder: value });
			},

			goToNextStep: () => {
				const { currentStep } = get();
				if (currentStep < 3) {
					set({ currentStep: (currentStep + 1) as CheckoutStep });
				}
			},

			goToPreviousStep: () => {
				const { currentStep } = get();
				if (currentStep > 1) {
					set({ currentStep: (currentStep - 1) as CheckoutStep });
				}
			},

			canNavigateTo: (step) => {
				const { completedSteps, currentStep } = get();
				// Can always go to current step or completed steps
				return step === currentStep || completedSteps.includes(step);
			},

			reset: () => {
				set(initialState);
			},
		}),
		{
			name: "kinedao-checkout-v1",
			storage: createJSONStorage(() => {
				// SSR-safe localStorage wrapper
				if (typeof window === "undefined") {
					return {
						getItem: () => null,
						setItem: () => {},
						removeItem: () => {},
					};
				}
				return localStorage;
			}),
			partialize: (state) => ({
				selectedAddressId: state.selectedAddressId,
				selectedAddress: state.selectedAddress,
				shippingCost: state.shippingCost,
				customerNotes: state.customerNotes,
				currentStep: state.currentStep,
				completedSteps: state.completedSteps,
			}),
		},
	),
);

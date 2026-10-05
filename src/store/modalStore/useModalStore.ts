import { create } from "zustand";

export type ModalType = "WARNING" | "CREATE_PROJECT" | null;

// The data we need to render the warning
interface ModalData {
  title: string;
  description: string;
  confirmText?: string;
  variant?: "danger" | "neutral"; // Red or Gray styling
  onConfirm: () => void | Promise<void>; // The magic function
}

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data: ModalData | null; // <--- Stores the text & callback

  // Actions
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: null,
  data: null,

  openModal: (type, data = undefined) => set({ isOpen: true, type, data }),

  closeModal: () => set({ isOpen: false, type: null, data: null }),
}));

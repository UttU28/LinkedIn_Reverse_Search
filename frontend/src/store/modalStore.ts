import { create } from 'zustand';

type ModalType = 'auth' | 'singleSearch' | 'csvUpload' | null;
type AuthTab = 'login' | 'signup';

interface ModalState {
  activeModal: ModalType;
  authTab: AuthTab;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setAuthTab: (tab: AuthTab) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  authTab: 'login',
  
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setAuthTab: (tab) => set({ authTab: tab }),
}));

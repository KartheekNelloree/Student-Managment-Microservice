import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside ToastProvider");
  return notify;
}

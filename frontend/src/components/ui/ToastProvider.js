import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext({
  success: (msg) => {},
  error: (msg) => {},
  info: (msg) => {},
  warning: (msg) => {},
});

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((variant, message, options = {}) => {
    const id = ++idCounter;
    setToasts((prev) => [
      ...prev,
      {
        id,
        variant,
        message,
        delay: options.delay ?? 3000,
      },
    ]);
  }, []);

  const api = useMemo(
    () => ({
      success: (m, o) => add('success', m, o),
      error: (m, o) => add('danger', m, o),
      info: (m, o) => add('info', m, o),
      warning: (m, o) => add('warning', m, o),
    }),
    [add]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={t.variant}
            onClose={() => remove(t.id)}
            delay={t.delay}
            autohide
          >
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

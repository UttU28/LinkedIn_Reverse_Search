import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="toast-enhanced">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-base font-bold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

// Add global styles to your app.css or global.css file:
// .toast-enhanced {
//   backdrop-filter: blur(8px);
//   transform: translateZ(0);
//   animation: toast-glow 2s ease-in-out infinite alternate;
// }
// 
// @keyframes toast-glow {
//   from {
//     box-shadow: 0 0 5px rgba(var(--primary), 0.3), 0 0 10px rgba(var(--primary), 0.2);
//   }
//   to {
//     box-shadow: 0 0 10px rgba(var(--primary), 0.6), 0 0 15px rgba(var(--primary), 0.4);
//   }
// }

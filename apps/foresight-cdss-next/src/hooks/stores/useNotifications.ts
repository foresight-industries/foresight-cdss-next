import { useUIStore } from "@/stores/uiStore";

export function useNotifications() {
  const showNotification = useUIStore((s) => s.showNotification);

  const showSuccess = (title: string, message?: string) => {
    showNotification({
      type: "success",
      title,
      message,
    });
  };

  const showError = (title: string, message?: string) => {
    showNotification({
      type: "error",
      title,
      message,
      duration: 10000, // Longer duration for errors
    });
  };

  const showWarning = (title: string, message?: string) => {
    showNotification({
      type: "warning",
      title,
      message,
    });
  };

  const showInfo = (title: string, message?: string) => {
    showNotification({
      type: "info",
      title,
      message,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

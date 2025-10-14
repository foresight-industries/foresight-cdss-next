import { useSessionStore } from "@/stores";

export class SecurityMonitor {
  private static instance: SecurityMonitor;

  private constructor() {
    if (globalThis.window) {
      this.detectDevTools();
      this.preventDataLeaks();
    }
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SecurityMonitor();
    }
    return this.instance;
  }

  private detectDevTools() {
    // Detect if DevTools is open
    const devtools = { open: false, orientation: null };

    const threshold = 160;
    const emitEvent = (state: boolean) => {
      if (state) {
        console.clear();
        this.handleDevToolsOpen();
      }
    };

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          emitEvent(true);
          devtools.open = true;
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  private handleDevToolsOpen() {
    // Clear sensitive data when DevTools opens
    if (process.env.NODE_ENV === "production") {
      // Log security event
      fetch("/api/security/devtools-opened", {
        method: "POST",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });

      // Clear any in-memory sensitive data
      useSessionStore.getState().clearSession();
    }
  }

  private preventDataLeaks() {
    // Override console methods in production
    if (process.env.NODE_ENV === "production") {
      const noop = () => undefined;
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      console.warn = noop;

      // Prevent right-click in production
      document.addEventListener("contextmenu", (e) => {
        if (process.env.NEXT_PUBLIC_DISABLE_RIGHT_CLICK === "true") {
          e.preventDefault();
        }
      });
    }
  }
}

class InactivityService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onTimeout: (() => void) | null = null;
  private timeoutMs = 15 * 60 * 1000;

  configure(options: { timeoutMs?: number; onTimeout: () => void }) {
    this.timeoutMs = options.timeoutMs ?? this.timeoutMs;
    this.onTimeout = options.onTimeout;
    this.reset();
  }

  reset() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.onTimeout) {
      return;
    }

    this.timer = setTimeout(() => {
      this.onTimeout?.();
    }, this.timeoutMs);
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const inactivityService = new InactivityService();
export default inactivityService;

// Web Audio API Synthesizer (Zero-asset, 100% offline & iOS Safari compatible)

class SoundPlayer {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.initUnlockListeners();
  }

  /**
   * Automatically attach user-gesture listeners on iOS / Safari to unlock Web Audio
   */
  private initUnlockListeners(): void {
    if (typeof window === "undefined") return;

    const unlockHandler = () => {
      this.unlockAudio();
      window.removeEventListener("touchstart", unlockHandler, true);
      window.removeEventListener("touchend", unlockHandler, true);
      window.removeEventListener("click", unlockHandler, true);
    };

    window.addEventListener("touchstart", unlockHandler, { capture: true, passive: true });
    window.addEventListener("touchend", unlockHandler, { capture: true, passive: true });
    window.addEventListener("click", unlockHandler, { capture: true, passive: true });
  }

  /**
   * Explicitly unlock audio on iOS WebKit
   */
  public unlockAudio(): void {
    if (typeof window === "undefined") return;

    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!this.isUnlocked) {
      try {
        // 1. Play 1-frame silent buffer to permanently unlock the Web Audio graph on iOS
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      } catch {}

      // 2. Play tiny silent HTML5 audio to initialize the iOS Media Session
      try {
        const silentAudio = new Audio(
          "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
        );
        silentAudio.volume = 0.01;
        silentAudio.play().catch(() => {});
      } catch {}
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Воспроизвести короткий звуковой сигнал таймера (beep)
   */
  public playBeep(
    frequency: number = 880,
    duration: number = 0.15,
    type: OscillatorType = "sine"
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const execute = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Smooth attack and decay to prevent audible click
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        console.warn("Audio playback error:", e);
      }
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(execute).catch(() => {});
    } else {
      execute();
    }
  }

  /**
   * Сигнал окончания отдыха: четкий двухтональный сигнал (880Hz -> 1320Hz)
   */
  public playRestComplete(): void {
    this.unlockAudio();
    this.playBeep(880, 0.18, "sine");
    setTimeout(() => {
      this.playBeep(1320, 0.35, "sine");
    }, 180);
  }

  /**
   * Предупреждающий щелчок (за 3, 2, 1 сек до конца)
   */
  public playTick(): void {
    this.playBeep(660, 0.08, "triangle");
  }

  /**
   * Победный аккорд завершения всей тренировки
   */
  public playWorkoutComplete(): void {
    this.unlockAudio();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playBeep(freq, 0.25, "triangle");
      }, i * 120);
    });
  }
}

export const soundPlayer = new SoundPlayer();

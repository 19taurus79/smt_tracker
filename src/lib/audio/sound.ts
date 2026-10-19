// Web Audio API Synthesizer (Zero-asset, 100% offline & low latency)

class SoundPlayer {
  private ctx: AudioContext | null = null;

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
  public playBeep(frequency: number = 880, duration: number = 0.15, type: OscillatorType = "sine"): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback error:", e);
    }
  }

  /**
   * Сигнал окончания отдыха: четкий двухтональный сигнал (880Hz -> 1320Hz)
   */
  public playRestComplete(): void {
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
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playBeep(freq, 0.25, "triangle");
      }, i * 120);
    });
  }
}

export const soundPlayer = new SoundPlayer();

/**
 * JUNCTION+ Audio Manager
 * 
 * Manages Web Audio API context, audio lifecycle, autoplay policies,
 * and generates original sonic brand identities for startup and profile interactions.
 */

class AudioManager {
  private ctx: AudioContext | null = null
  private isSoundEnabled = true
  private lastProfilePlayedTime = 0
  private readonly PROFILE_COOLDOWN_MS = 600

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('junction_sound_enabled')
      // Default to true unless explicitly turned off
      this.isSoundEnabled = saved !== null ? saved === 'true' : true
    }
  }

  /**
   * Initializes or gets the shared AudioContext.
   */
  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Autoplay policy prevented immediate resume; will resume on first user interaction
      })
    }

    return this.ctx
  }

  public getSoundEnabled(): boolean {
    return this.isSoundEnabled
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('junction_sound_enabled', String(enabled))
    }
    if (enabled) {
      this.getContext()
    }
  }

  public toggleSound(): boolean {
    const next = !this.isSoundEnabled
    this.setSoundEnabled(next)
    return next
  }

  /**
   * Startup intro sound effect has been removed per specification.
   */
  public async playStartupSound(_force = false): Promise<boolean> {
    return false
  }

  /**
   * Synthesizes the soft, original Profile Selection confirmation sound (~0.4s).
   * Warm ascending harmonic interval (D4 -> F#4) with soft acoustic decay.
   */
  public async playProfileSelectSound(force = false): Promise<boolean> {
    if (!force && !this.isSoundEnabled) return false

    const now = Date.now()
    if (now - this.lastProfilePlayedTime < this.PROFILE_COOLDOWN_MS) {
      return false
    }

    const ctx = this.getContext()
    if (!ctx) return false

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        return false
      }
    }

    this.lastProfilePlayedTime = now
    const startTime = ctx.currentTime + 0.02

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.20, startTime)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1800, startTime)
    filter.frequency.exponentialRampToValueAtTime(800, startTime + 0.35)

    masterGain.connect(filter)
    filter.connect(ctx.destination)

    // Note 1: D4 (293.66 Hz) warm root chime
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(293.66, startTime)

    gain1.gain.setValueAtTime(0.0001, startTime)
    gain1.gain.linearRampToValueAtTime(0.25, startTime + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.32)

    osc1.connect(gain1)
    gain1.connect(masterGain)
    osc1.start(startTime)
    osc1.stop(startTime + 0.34)

    // Note 2: F#4 (369.99 Hz) ascending major third resolve
    const note2Start = startTime + 0.07
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(369.99, note2Start)

    gain2.gain.setValueAtTime(0.0001, note2Start)
    gain2.gain.linearRampToValueAtTime(0.22, note2Start + 0.02)
    gain2.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.38)

    osc2.connect(gain2)
    gain2.connect(masterGain)
    osc2.start(note2Start)
    osc2.stop(note2Start + 0.40)

    return true
  }

  /**
   * Cleans up AudioContext resources when tearing down.
   */
  public dispose(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

export const audioManager = new AudioManager()

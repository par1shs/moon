/**
 * High-Performance Unified Scroll Coordinator
 *
 * Consolidates multiple independent window.addEventListener('scroll') and
 * requestAnimationFrame loops across PIXEL into a single passive listener
 * and a single coordinated rAF tick per display refresh.
 *
 * Caches document and viewport dimensions to eliminate forced layout reflows.
 */

type ScrollCallback = (scrollY: number, maxScroll: number) => void

class ScrollCoordinator {
  private subscribers = new Set<ScrollCallback>()
  private isListening = false
  private rafId: number | null = null
  private scrollY = 0
  private maxScroll = 1
  private resizeObserver: ResizeObserver | null = null

  private updateMetrics = () => {
    if (typeof window === 'undefined') return
    const docHeight = document.documentElement.scrollHeight || 0
    const viewHeight = window.innerHeight || 0
    this.maxScroll = Math.max(1, docHeight - viewHeight)
    this.scrollY = window.scrollY || document.documentElement.scrollTop || 0
  }

  private onFrame = () => {
    this.scrollY = window.scrollY || document.documentElement.scrollTop || 0
    const currentY = this.scrollY
    const max = this.maxScroll

    for (const callback of this.subscribers) {
      try {
        callback(currentY, max)
      } catch (err) {
        console.error('Error in scroll subscriber:', err)
      }
    }

    this.rafId = null
  }

  private onScroll = () => {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(this.onFrame)
  }

  private onResize = () => {
    this.updateMetrics()
    this.onScroll()
  }

  private start() {
    if (this.isListening || typeof window === 'undefined') return
    this.isListening = true
    this.updateMetrics()

    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize, { passive: true })

    // Also observe document body size changes without polling
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateMetrics()
      })
      this.resizeObserver.observe(document.body)
    }
  }

  private stop() {
    if (!this.isListening || typeof window === 'undefined') return
    this.isListening = false

    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  public subscribe(callback: ScrollCallback): () => void {
    this.subscribers.add(callback)
    if (!this.isListening) {
      this.start()
    }

    // Immediately trigger with current values
    this.updateMetrics()
    callback(this.scrollY, this.maxScroll)

    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0) {
        this.stop()
      }
    }
  }

  public getScrollY(): number {
    return this.scrollY
  }

  public getMaxScroll(): number {
    return this.maxScroll
  }
}

export const scrollCoordinator = new ScrollCoordinator()

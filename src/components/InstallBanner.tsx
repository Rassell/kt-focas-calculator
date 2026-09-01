import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-banner-dismissed'
const DISMISS_DAYS = 7

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const ts = Number(raw)
    if (Number.isNaN(ts)) return false
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOSDevice] = useState(() => isIOS())

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    const onAppInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    // iOS has no beforeinstallprompt — show manual instructions after a short delay
    // only if not standalone and not dismissed
    let iosTimer: number | undefined
    if (isIOS() && !isStandalone()) {
      iosTimer = window.setTimeout(() => setVisible(true), 1200)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      if (iosTimer) window.clearTimeout(iosTimer)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      // iOS fallback — just dismiss (user must use Share menu)
      dismiss()
      return
    }
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setVisible(false)
      } else {
        // user dismissed the native prompt — snooze banner
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
        setVisible(false)
      }
    } catch {
      setVisible(false)
    } finally {
      setDeferredPrompt(null)
    }
  }, [deferredPrompt, dismiss])

  if (!visible) return null

  const canPrompt = !!deferredPrompt

  return (
    <div
      role="dialog"
      aria-label="Install app"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 pointer-events-none md:hidden"
    >
      <div className="pointer-events-auto flex w-full max-w-[520px] items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1d27] px-3.5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]">
        <img
          src={`${import.meta.env.BASE_URL}icon-192.png`}
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl object-cover bg-white"
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="m-0 text-[13px] font-semibold leading-none text-white">Install KT FOCAS</p>
          <p className="m-0 mt-1 text-[12px] leading-[1.3] text-white/60">
            {canPrompt
              ? 'Add to your home screen for quick access.'
              : isIOSDevice
                ? 'Tap Share → Add to Home Screen to install.'
                : 'Add to your home screen for quick access.'}
          </p>
        </div>

        {canPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            Install
          </button>
        ) : isIOSDevice ? (
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80">
            Share ↗︎
          </span>
        ) : null}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner"
          className="shrink-0 -mr-1 grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

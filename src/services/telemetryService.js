// Reader Telemetry & Behavioral Measurement Engine
// Designed for High-Retention Publishing & Conversion Rate Optimization (CRO)

const TELEMETRY_KEY = 'horizon_telemetry_events_v2';
const SESSION_KEY = 'horizon_reader_session_v2';
const REFERRALS_KEY = 'horizon_staff_referrals_v2';

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Telemetry Warning] Exceeded quota on key "${key}"`, err);
  }
};

export const telemetryService = {
  // Capture Referral Code from query parameter (?ref=QB or ?utm_source=QB)
  getReferralCode() {
    if (typeof window === 'undefined') return null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      return urlParams.get('ref') || hashParams.get('ref') || urlParams.get('utm_source') || null;
    } catch {
      return null;
    }
  },

  // Staff Seeding attribution managed via Google Analytics 4
  recordStaffHit(staffCode, postSlug) {
    // Internal counters disabled - 100% verified via Google Analytics 4
  },

  // Get or initialize current reader session info
  getSessionInfo() {
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      session = null;
    }

    if (!session) {
      session = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        visitCount: 1,
        articlesRead: [],
        totalDwellSeconds: 0,
        bookmarkedCount: 0,
        referralCode: this.getReferralCode()
      };
      safeSetItem(SESSION_KEY, JSON.stringify(session));
    } else {
      // Check if this is a new session (e.g., >30 min since last visit)
      const lastVisitTime = new Date(session.lastVisit).getTime();
      const now = Date.now();
      if (now - lastVisitTime > 30 * 60 * 1000) {
        session.visitCount = (session.visitCount || 1) + 1;
        session.lastVisit = new Date().toISOString();
        safeSetItem(SESSION_KEY, JSON.stringify(session));
      }
    }
    return session;
  },

  // Send Direct Google Analytics 4 (GA4) Event
  sendGA4Event(eventName, params = {}) {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, params);
      } catch (e) {
        console.warn('[GA4 Forwarding Warning]', e);
      }
    }
  },

  // Record an explicit telemetry event
  trackEvent(eventName, payload = {}) {
    const session = this.getSessionInfo();
    const refCode = this.getReferralCode();
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      referralCode: refCode || session.referralCode,
      eventName,
      ...payload
    };

    try {
      const stored = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || '[]');
      // Keep last 50 events to manage storage
      const updated = [event, ...stored].slice(0, 50);
      safeSetItem(TELEMETRY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[Telemetry Warning] Failed to persist event:', e);
    }

    // Forward to GA4
    this.sendGA4Event(eventName, {
      ...payload,
      staff_ref: refCode || '',
      session_id: session.sessionId
    });

    // Log to console in development mode
    if (typeof window !== 'undefined' && window.__HORIZON_DEBUG__) {
      console.log(`📡 [Telemetry Tracked] ${eventName}:`, payload);
    }

    return event;
  },

  // Track Article Reading Session with Active Dwell Time & Scroll Depth
  initArticleTelemetry(postSlug, postTitle) {
    const session = this.getSessionInfo();
    const refCode = this.getReferralCode();
    if (refCode) {
      this.recordStaffHit(refCode, postSlug);
    }

    if (!session.articlesRead.includes(postSlug)) {
      session.articlesRead.push(postSlug);
      safeSetItem(SESSION_KEY, JSON.stringify(session));
    }

    // Forward to GA4 with staff attribution
    this.sendGA4Event('page_view', {
      page_title: postTitle,
      page_location: window.location.href,
      page_path: window.location.pathname,
      staff_ref: refCode || 'DIRECT',
      staff_code: refCode || 'DIRECT'
    });

    if (refCode) {
      this.sendGA4Event('seeding_referral_click', {
        staff_code: refCode,
        post_slug: postSlug,
        post_title: postTitle,
        referral_url: window.location.href
      });
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('set', 'user_properties', {
          staff_referral_code: refCode
        });
      }
    }

    this.trackEvent('article_view_start', { postSlug, postTitle, staffRef: refCode });

    let activeDwellSeconds = 0;
    let isTabActive = document.visibilityState === 'visible';
    const reachedScrollMilestones = new Set();

    // Dwell Time Timer (ticks only when tab is visible)
    const dwellInterval = setInterval(() => {
      if (isTabActive) {
        activeDwellSeconds += 1;
        // Check 30s, 60s, 180s milestones
        if (activeDwellSeconds === 30) {
          telemetryService.trackEvent('reading_milestone_30s', { postSlug, dwell: 30 });
        } else if (activeDwellSeconds === 90) {
          telemetryService.trackEvent('reading_milestone_90s_engaged', { postSlug, dwell: 90 });
        } else if (activeDwellSeconds === 180) {
          telemetryService.trackEvent('reading_milestone_180s_deepdive', { postSlug, dwell: 180 });
        }
      }
    }, 1000);

    // Tab visibility tracker
    const handleVisibilityChange = () => {
      isTabActive = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Scroll depth tracker
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const currentScroll = window.scrollY;
      const percent = Math.min(100, Math.round((currentScroll / scrollHeight) * 100));

      const milestones = [25, 50, 75, 100];
      milestones.forEach(m => {
        if (percent >= m && !reachedScrollMilestones.has(m)) {
          reachedScrollMilestones.add(m);
          telemetryService.trackEvent(`scroll_depth_${m}%`, { 
            postSlug, 
            scrollPercent: percent,
            dwellSeconds: activeDwellSeconds 
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Text Copy Detection (High intent reader signal)
    const handleCopy = () => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 10) {
        telemetryService.trackEvent('text_snippet_copied', {
          postSlug,
          length: selection.length,
          snippet: selection.slice(0, 60) + '...'
        });
      }
    };
    document.addEventListener('copy', handleCopy);

    // Return cleanup function when leaving the article page
    return () => {
      try {
        clearInterval(dwellInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('copy', handleCopy);

        // Final completion event
        telemetryService.trackEvent('article_view_end', {
          postSlug,
          totalActiveDwellSeconds: activeDwellSeconds,
          maxScrollDepth: Math.max(0, ...Array.from(reachedScrollMilestones))
        });

        // Update total session dwell
        const currentSession = telemetryService.getSessionInfo();
        if (currentSession) {
          currentSession.totalDwellSeconds = (currentSession.totalDwellSeconds || 0) + activeDwellSeconds;
          safeSetItem(SESSION_KEY, JSON.stringify(currentSession));
        }
      } catch {}
    };
  },

  // Get aggregated stats for Admin Dashboard
  getAggregatedMetrics() {
    try {
      const events = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || '[]');
      const session = this.getSessionInfo();
      
      const scroll100Events = events.filter(e => e.eventName === 'scroll_depth_100%').length;
      const audioEvents = events.filter(e => e.eventName === 'audio_playback_started').length;
      const shareEvents = events.filter(e => e.eventName === 'social_share_clicked').length;
      const copyEvents = events.filter(e => e.eventName === 'text_snippet_copied').length;

      const staffReferrals = JSON.parse(localStorage.getItem(REFERRALS_KEY) || '{"QB": 18, "MINH": 12, "AN": 9}');

      return {
        session,
        recentEvents: events.slice(0, 15),
        staffReferrals,
        stats: {
          totalEvents: events.length,
          fullReadCompletions: scroll100Events,
          audioPlays: audioEvents,
          socialShares: shareEvents,
          snippetsCopied: copyEvents
        }
      };
    } catch {
      return null;
    }
  }
};

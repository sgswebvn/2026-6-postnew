import React, { useEffect } from 'react';
import { api } from '../../api/client';

export default function ScriptInjector({ settings, pathname }) {
  // 1. Google Analytics 4 (GA4) Tracking
  useEffect(() => {
    const gaId = settings?.gaTrackingId;
    if (!gaId || typeof gaId !== 'string' || !gaId.startsWith('G-')) {
      // Remove script if disabled
      const existing = document.getElementById('ga-gtag-script');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }

    let scriptTag = document.getElementById('ga-gtag-script');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'ga-gtag-script';
      scriptTag.async = true;
      scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(scriptTag);

      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
    }

    if (typeof window.gtag === 'function') {
      window.gtag('config', gaId, {
        page_path: pathname || window.location.pathname,
        page_title: document.title
      });
    }
  }, [settings?.gaTrackingId, pathname]);

  // 2. Google Tag Manager (GTM)
  useEffect(() => {
    const gtmId = settings?.gtmId;
    if (!gtmId || typeof gtmId !== 'string' || !gtmId.startsWith('GTM-')) {
      const existingScript = document.getElementById('gtm-script');
      if (existingScript && existingScript.parentNode) existingScript.parentNode.removeChild(existingScript);
      const existingNoscript = document.getElementById('gtm-noscript');
      if (existingNoscript && existingNoscript.parentNode) existingNoscript.parentNode.removeChild(existingNoscript);
      return;
    }

    if (!document.getElementById('gtm-script')) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'dataLayer','${gtmId}');`;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript';
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }, [settings?.gtmId]);

  // 3. Search Engine Verification Meta Tags & SEO Metadata
  useEffect(() => {
    function setMetaTag(name, content) {
      if (!content) {
        const el = document.querySelector(`meta[name="${name}"]`);
        if (el && el.parentNode) el.parentNode.removeChild(el);
        return;
      }
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }

    if (settings?.metaVerification?.google) {
      setMetaTag('google-site-verification', settings.metaVerification.google);
    }
    if (settings?.metaVerification?.bing) {
      setMetaTag('msvalidate.01', settings.metaVerification.bing);
    }
    if (settings?.metaVerification?.pinterest) {
      setMetaTag('p:domain_verify', settings.metaVerification.pinterest);
    }

    // Default SEO meta description on homepage
    if (pathname === '/' || pathname === '') {
      if (settings?.seo?.metaDescription) {
        setMetaTag('description', settings.seo.metaDescription);
      }
      if (settings?.seo?.defaultKeywords) {
        setMetaTag('keywords', settings.seo.defaultKeywords);
      }
      if (settings?.seo?.metaTitle || settings?.siteName) {
        document.title = settings.seo?.metaTitle || `${settings.siteName} - ${settings.tagline || 'Modern Intelligence'}`;
      }
    }
  }, [settings?.metaVerification, settings?.seo, settings?.siteName, settings?.tagline, pathname]);

  // 4. Google AdSense Master Script
  useEffect(() => {
    const isAdsEnabled = settings?.adsense?.enabled === true;
    const publisherId = settings?.adsense?.publisherId;
    const isValidPubId = publisherId && typeof publisherId === 'string' && publisherId.startsWith('ca-pub-');

    let scriptTag = document.getElementById('adsense-master-script');

    if (isAdsEnabled && isValidPubId) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'adsense-master-script';
        scriptTag.async = true;
        scriptTag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
        scriptTag.crossOrigin = 'anonymous';
        document.head.appendChild(scriptTag);
      }
    } else {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    }
  }, [settings?.adsense?.enabled, settings?.adsense?.publisherId]);

  // 5. Custom Header & Footer Script Injection from Database
  useEffect(() => {
    let cleanupFns = [];

    async function loadAndInjectScripts() {
      try {
        const scripts = await api.getPublicScripts();
        if (!Array.isArray(scripts) || scripts.length === 0) return;

        const isHome = pathname === '/' || pathname === '';
        const isPost = pathname.startsWith('/post/');

        scripts.forEach((script) => {
          if (!script.enabled) return;

          // Check scope
          if (script.scope === 'home_only' && !isHome) return;
          if (script.scope === 'posts_only' && !isPost) return;

          const containerId = `custom-script-${script.id || script._id}`;
          // Avoid duplicate injection
          if (document.getElementById(containerId)) return;

          const wrapper = document.createElement('div');
          wrapper.id = containerId;
          wrapper.style.display = 'none';

          const temp = document.createElement('div');
          temp.innerHTML = script.code;

          Array.from(temp.childNodes).forEach((node) => {
            if (node.tagName === 'SCRIPT') {
              const activeScript = document.createElement('script');
              Array.from(node.attributes).forEach((attr) => {
                activeScript.setAttribute(attr.name, attr.value);
              });
              activeScript.text = node.innerHTML;
              wrapper.appendChild(activeScript);
            } else {
              wrapper.appendChild(node.cloneNode(true));
            }
          });

          // Mount to specified target location
          if (script.location === 'header') {
            document.head.appendChild(wrapper);
            cleanupFns.push(() => {
              if (document.head.contains(wrapper)) document.head.removeChild(wrapper);
            });
          } else if (script.location === 'body_start') {
            document.body.insertBefore(wrapper, document.body.firstChild);
            cleanupFns.push(() => {
              if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
            });
          } else {
            document.body.appendChild(wrapper);
            cleanupFns.push(() => {
              if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
            });
          }
        });
      } catch (e) {
        console.warn('[ScriptInjector] Warning: could not load public scripts:', e.message);
      }
    }

    loadAndInjectScripts();

    return () => {
      cleanupFns.forEach((fn) => {
        try { fn(); } catch (e) {}
      });
    };
  }, [pathname]);

  return null;
}

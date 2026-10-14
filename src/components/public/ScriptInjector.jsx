import React, { useEffect } from 'react';
import { api } from '../../api/client';

export default function ScriptInjector({ settings, pathname }) {
  // 1. Google Analytics 4 (GA4) Tracking
  useEffect(() => {
    const gaId = settings?.gaTrackingId;
    if (!gaId || typeof gaId !== 'string' || !gaId.startsWith('G-')) {
      return;
    }

    // Check if gtag script already loaded
    let scriptTag = document.getElementById('ga-gtag-script');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'ga-gtag-script';
      scriptTag.async = true;
      scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(scriptTag);

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
    }

    // Send single clean page_view event on route change
    if (typeof window.gtag === 'function') {
      window.gtag('config', gaId, {
        page_path: pathname || window.location.pathname,
        page_title: document.title
      });
    }
  }, [settings?.gaTrackingId, pathname]);

  // 2. Custom Header & Footer Script Injection
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

          // Safely execute script contents by creating executable script elements
          // Parsing HTML strings to create active script tags
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
            // footer
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

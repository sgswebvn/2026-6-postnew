import React, { useEffect } from 'react';
import { api } from '../../api/client';

export default function ScriptInjector({ settings, pathname, currentPost, currentCategory }) {
  // 1. Google Analytics 4 (GA4) Tracking
  useEffect(() => {
    const gaId = settings?.gaTrackingId;
    if (!gaId || typeof gaId !== 'string' || !gaId.startsWith('G-')) {
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

  // 3. Technical SEO: Metadata, Canonical, OpenGraph, Twitter, and Robots Directives
  useEffect(() => {
    function setMeta(nameOrProperty, value, isProperty = false) {
      if (!value) return;
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, nameOrProperty);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    }

    function setCanonical(url) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }

    const siteName = settings?.siteName || 'THE HORIZON POST';
    const siteUrl = (settings?.siteUrl || window.location.origin).replace(/\/+$/, '');
    const currentUrl = `${siteUrl}${pathname}`;

    // A. Robots Directive: Strictly noindex admin & login routes
    if (pathname.startsWith('/admin')) {
      setMeta('robots', 'noindex, nofollow');
      document.title = `Admin Portal | ${siteName}`;
      return;
    } else {
      setMeta('robots', 'index, follow, max-image-preview:large');
    }

    // Set canonical URL
    setCanonical(currentUrl);

    // Site-wide metadata defaults
    setMeta('og:site_name', siteName, true);
    setMeta('twitter:card', 'summary_large_image');

    // Webmaster verifications
    if (settings?.metaVerification?.google) setMeta('google-site-verification', settings.metaVerification.google);
    if (settings?.metaVerification?.bing) setMeta('msvalidate.01', settings.metaVerification.bing);
    if (settings?.metaVerification?.pinterest) setMeta('p:domain_verify', settings.metaVerification.pinterest);

    // B. Route-specific metadata
    if (pathname === '/' || pathname === '') {
      const pageTitle = settings?.seo?.metaTitle || `${siteName} — ${settings?.tagline || 'Modern Intelligence'}`;
      const pageDesc = settings?.seo?.metaDescription || settings?.tagline || 'In-depth investigative journalism, semiconductor analysis, and macroeconomic intelligence.';
      document.title = pageTitle;

      setMeta('description', pageDesc);
      setMeta('keywords', settings?.seo?.defaultKeywords || 'technology, finance, semiconductors, artificial intelligence');
      setMeta('og:title', pageTitle, true);
      setMeta('og:description', pageDesc, true);
      setMeta('og:url', currentUrl, true);
      setMeta('og:type', 'website', true);
      if (settings?.seo?.ogImage) {
        setMeta('og:image', settings.seo.ogImage, true);
        setMeta('twitter:image', settings.seo.ogImage);
      }
      setMeta('twitter:title', pageTitle);
      setMeta('twitter:description', pageDesc);
    } else if (pathname.startsWith('/post/') && currentPost) {
      const pageTitle = currentPost.metaTitle || `${currentPost.title} | ${siteName}`;
      const pageDesc = currentPost.metaDescription || currentPost.excerpt || 'Read full investigative dispatch.';
      document.title = pageTitle;

      setMeta('description', pageDesc);
      if (currentPost.tags && currentPost.tags.length > 0) {
        setMeta('keywords', currentPost.tags.join(', '));
      }
      setMeta('og:title', pageTitle, true);
      setMeta('og:description', pageDesc, true);
      setMeta('og:url', currentUrl, true);
      setMeta('og:type', 'article', true);
      if (currentPost.coverImage) {
        setMeta('og:image', currentPost.coverImage, true);
        setMeta('twitter:image', currentPost.coverImage);
      }
      setMeta('twitter:title', pageTitle);
      setMeta('twitter:description', pageDesc);
    } else if (pathname.startsWith('/category/') && currentCategory) {
      const pageTitle = `${currentCategory.name} Analysis & Articles | ${siteName}`;
      const pageDesc = currentCategory.description || `Browse articles and dispatches on ${currentCategory.name}.`;
      document.title = pageTitle;

      setMeta('description', pageDesc);
      setMeta('og:title', pageTitle, true);
      setMeta('og:description', pageDesc, true);
      setMeta('og:url', currentUrl, true);
      setMeta('og:type', 'website', true);
    } else if (pathname === '/about') {
      document.title = `About Us | ${siteName}`;
      setMeta('description', `Learn about ${siteName}, our editorial mission, and standards of reporting.`);
    } else if (pathname === '/contact') {
      document.title = `Contact Our Editorial Desk | ${siteName}`;
      setMeta('description', `Get in touch with the editorial team at ${siteName}.`);
    } else if (pathname === '/privacy-policy') {
      document.title = `Privacy Policy | ${siteName}`;
      setMeta('description', `Privacy Policy and data protection disclosures for ${siteName}.`);
    } else if (pathname === '/terms') {
      document.title = `Terms of Service | ${siteName}`;
      setMeta('description', `Terms of Service and legal conditions for ${siteName}.`);
    } else if (pathname === '/cookie-policy') {
      document.title = `Cookie Policy | ${siteName}`;
      setMeta('description', `Information about cookies and tracking technologies used on ${siteName}.`);
    } else if (pathname === '/search') {
      document.title = `Search Articles | ${siteName}`;
    }
  }, [settings, pathname, currentPost, currentCategory]);

  // 4. JSON-LD Structured Data Injection
  useEffect(() => {
    let scriptTag = document.getElementById('json-ld-structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'json-ld-structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const siteName = settings?.siteName || 'THE HORIZON POST';
    const siteUrl = (settings?.siteUrl || window.location.origin).replace(/\/+$/, '');

    // Skip structured data on admin pages
    if (pathname.startsWith('/admin')) {
      scriptTag.innerHTML = '';
      return;
    }

    let schema = null;

    if (pathname === '/' || pathname === '') {
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
    } else if (pathname.startsWith('/post/') && currentPost) {
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}/post/${currentPost.slug}`
        },
        headline: currentPost.title,
        description: currentPost.excerpt || currentPost.title,
        image: currentPost.coverImage ? [currentPost.coverImage] : undefined,
        datePublished: (currentPost.publishedAt || currentPost.createdAt || new Date()).toISOString(),
        dateModified: (currentPost.updatedAt || currentPost.publishedAt || new Date()).toISOString(),
        publisher: {
          '@type': 'Organization',
          name: siteName,
          url: siteUrl
        }
      };
    } else if (pathname.startsWith('/category/') && currentCategory) {
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: currentCategory.name,
            item: `${siteUrl}/category/${currentCategory.slug || currentCategory.id}`
          }
        ]
      };
    }

    if (schema) {
      scriptTag.innerHTML = JSON.stringify(schema);
    } else {
      scriptTag.innerHTML = '';
    }
  }, [settings, pathname, currentPost, currentCategory]);

  // 5. Google AdSense Master Script
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

  // 6. Custom Header & Footer Script Injection from Database
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

          if (script.scope === 'home_only' && !isHome) return;
          if (script.scope === 'posts_only' && !isPost) return;

          const containerId = `custom-script-${script.id || script._id}`;
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

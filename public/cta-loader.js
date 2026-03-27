/**
 * CTA Loader — Blockchain-Ads
 * 
 * Lightweight script (~3KB) to inject into Webflow's site-wide custom code.
 * Detects <div data-cta="slug"> elements, fetches rendered CTAs from the API,
 * and replaces placeholders with live CTA content.
 * 
 * Features:
 * - Auto locale detection from URL path
 * - Batch fetching (one API call for all CTAs on a page)
 * - Impression tracking via IntersectionObserver
 * - Click tracking via sendBeacon
 * - Admin preview mode (highlights CTAs with pulsing border)
 * - Skeleton loading state to prevent CLS
 * 
 * Usage: Add to Webflow → Project Settings → Custom Code → Before </body>:
 * <script src="https://your-domain.com/cta-loader.js"></script>
 */
(function () {
  'use strict';

  // ── Configuration ─────────────────────────────────────────────
  // Change this to your Webflow Cloud app domain
  var API_BASE = window.__CTA_API_BASE || '';
  var KNOWN_LOCALES = ['en', 'ru', 'es', 'ko', 'zh', 'ja', 'tr'];
  var isAdminPreview = window.location.search.indexOf('admin-preview=true') !== -1;

  // ── Detect locale from URL ────────────────────────────────────
  function detectLocale() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && KNOWN_LOCALES.indexOf(parts[0]) !== -1) {
      return parts[0];
    }
    return 'en';
  }

  // ── Add skeleton loading state ────────────────────────────────
  function addSkeleton(el) {
    el.style.minHeight = '120px';
    el.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    el.style.backgroundSize = '200% 100%';
    el.style.animation = 'bca-skeleton 1.5s ease-in-out infinite';
    el.style.borderRadius = '12px';

    // Inject skeleton animation if not already present
    if (!document.getElementById('bca-skeleton-style')) {
      var style = document.createElement('style');
      style.id = 'bca-skeleton-style';
      style.textContent = '@keyframes bca-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
      document.head.appendChild(style);
    }
  }

  // ── Admin preview highlighting ────────────────────────────────
  function addAdminHighlight(el) {
    if (!isAdminPreview) return;

    if (!document.getElementById('bca-admin-style')) {
      var style = document.createElement('style');
      style.id = 'bca-admin-style';
      style.textContent = [
        '@keyframes bca-pulse { 0%, 100% { box-shadow: 0 0 0 3px rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 6px rgba(99,102,241,0.2); } }',
        '.bca-admin-highlight { outline: 2px dashed #6366f1; outline-offset: 4px; animation: bca-pulse 2s ease-in-out infinite; position: relative; }',
        '.bca-admin-highlight::after { content: attr(data-cta); position: absolute; top: -28px; left: 0; background: #6366f1; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: monospace; }',
      ].join('\n');
      document.head.appendChild(style);
    }

    el.classList.add('bca-admin-highlight');
  }

  // ── Main loader ───────────────────────────────────────────────
  function loadCTAs() {
    var elements = document.querySelectorAll('[data-cta]');
    if (elements.length === 0) return;

    var locale = detectLocale();
    var items = []; // { slug, variant } pairs for batch request
    var elMap = {}; // key: "slug::variant" → elements[]

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var slug = el.getAttribute('data-cta');
      if (!slug) continue;
      var variant = el.getAttribute('data-variant') || 'default';

      addSkeleton(el);

      var key = slug + '::' + variant;
      // Collect unique slug+variant combos for the batch request
      var alreadyAdded = false;
      for (var x = 0; x < items.length; x++) {
        if (items[x].slug === slug && items[x].variant === variant) {
          alreadyAdded = true;
          break;
        }
      }
      if (!alreadyAdded) {
        items.push({ slug: slug, variant: variant });
      }
      if (!elMap[key]) elMap[key] = [];
      elMap[key].push(el);
    }

    // Batch fetch all CTAs (with variant support)
    var url = API_BASE + '/cta-admin/api/cta-batch';
    var payload = JSON.stringify({
      items: items,
      locale: locale,
      pageUrl: window.location.origin + window.location.pathname,
    });

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // Inject combined CSS
        if (data.css) {
          var style = document.createElement('style');
          style.id = 'bca-cta-styles';
          style.textContent = data.css;
          document.head.appendChild(style);
        }

        // Render each CTA
        var ctaData = data.ctas || {};
        for (var ctaKey in ctaData) {
          var cta = ctaData[ctaKey];
          var targets = elMap[ctaKey];
          if (!targets || !cta.html) continue;

          for (var j = 0; j < targets.length; j++) {
            var el = targets[j];
            var elSlug = el.getAttribute('data-cta');
            var elVariant = el.getAttribute('data-variant') || 'default';

            // Clear skeleton
            el.style.minHeight = '';
            el.style.background = '';
            el.style.backgroundSize = '';
            el.style.animation = '';

            // Set HTML with fade-in
            el.innerHTML = cta.html;
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.4s ease';

            // Trigger fade-in
            requestAnimationFrame(function (element) {
              return function () { element.style.opacity = '1'; };
            }(el));

            // Admin preview highlight
            addAdminHighlight(el);

            // Set up tracking (with variant)
            setupTracking(el, elSlug, locale, elVariant);
          }
        }
      })
      .catch(function (err) {
        console.warn('[CTA Loader] Failed to load CTAs:', err);
        // Remove skeletons on error
        for (var k = 0; k < elements.length; k++) {
          elements[k].style.minHeight = '';
          elements[k].style.background = '';
          elements[k].style.animation = '';
        }
      });
  }

  // ── Analytics Tracking ────────────────────────────────────────
  var pendingEvents = [];
  var flushTimeout = null;

  function setupTracking(el, slug, locale, variant) {
    // Impression tracking via IntersectionObserver
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            queueEvent(slug, 'impression', locale, variant);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(el);
    }

    // Click tracking
    el.addEventListener('click', function (e) {
      var target = e.target;
      // Check if clicked on a link/button
      while (target && target !== el) {
        if (target.tagName === 'A' || target.tagName === 'BUTTON') {
          queueEvent(slug, 'click', locale, variant);
          flushEvents(); // Flush immediately on click
          break;
        }
        target = target.parentElement;
      }
    });
  }

  function queueEvent(slug, type, locale, variant) {
    pendingEvents.push({
      slug: slug,
      pageUrl: window.location.origin + window.location.pathname,
      locale: locale,
      variant: variant || 'default',
      type: type,
    });

    // Debounce flush
    if (flushTimeout) clearTimeout(flushTimeout);
    flushTimeout = setTimeout(flushEvents, 2000);
  }

  function flushEvents() {
    if (pendingEvents.length === 0) return;

    var events = pendingEvents.slice();
    pendingEvents = [];

    var url = API_BASE + '/cta-admin/api/track';
    var payload = JSON.stringify({ events: events });

    // Use sendBeacon for non-blocking send
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payload);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function () {});
    }
  }

  // Flush on page unload
  window.addEventListener('beforeunload', flushEvents);

  // ── Initialize ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCTAs);
  } else {
    loadCTAs();
  }
})();

'use client';

import { useState } from 'react';

interface DocSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections: DocSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      content: (
        <>
          <p>
            The CTA Manager is an internal tool for creating, managing, and tracking call-to-action blocks
            across blog posts on the Blockchain-Ads website. It runs as a standalone app mounted at
            <code>/cta-admin</code> and serves CTAs dynamically via a lightweight loader script.
          </p>
          <div className="docs-callout">
            <strong>How it works:</strong> You create CTAs in the admin dashboard, then place them in Webflow blog posts
            using a simple embed code. The loader script fetches and renders them automatically, with full style isolation
            so Webflow styles never interfere.
          </div>
          <h3>Key Concepts</h3>
          <table className="data-table">
            <thead>
              <tr><th>Concept</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>CTA</strong></td><td>A call-to-action block with a heading, body text, button, and optional image. Each CTA has a unique slug used in embed codes.</td></tr>
              <tr><td><strong>Template</strong></td><td>The visual layout of a CTA. Choose from standard templates (Banner, Card, Inline, Image + Text) or write custom HTML.</td></tr>
              <tr><td><strong>Variant</strong></td><td>Different content versions within one CTA. Use variants when placing multiple CTAs from the same slug in one article (e.g. top, middle, bottom).</td></tr>
              <tr><td><strong>Locale</strong></td><td>Language-specific content. The loader auto-detects the visitor's language from the URL and serves the matching translation.</td></tr>
              <tr><td><strong>Scope</strong></td><td>Where a CTA applies — Global (all articles), Vertical-specific, or Article-specific.</td></tr>
            </tbody>
          </table>
        </>
      ),
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <>
          <h3>Step 1: Add the Loader Script</h3>
          <p>The loader script needs to be on every page where CTAs should appear. For blog posts:</p>
          <ol>
            <li>Open the <strong>Post Template</strong> in Webflow Designer</li>
            <li>Click the page settings (gear icon)</li>
            <li>Scroll to <strong>Custom Code &rarr; Before &lt;/body&gt; tag</strong></li>
            <li>Paste the following:</li>
          </ol>
          <div className="docs-code">
            {`<script src="/cta-admin/cta-loader.js"></script>`}
          </div>
          <p>Publish your site. The script only activates on pages that have CTA embed codes.</p>

          <h3>Step 2: Create a CTA</h3>
          <ol>
            <li>Go to <strong>CTAs &rarr; Create CTA</strong></li>
            <li>Enter a name (e.g. "Book a Demo") — the slug auto-generates</li>
            <li>Choose a template</li>
            <li>Fill in the content: heading, body, button text, button URL</li>
            <li>Click <strong>Create CTA</strong></li>
          </ol>

          <h3>Step 3: Place It in a Blog Post</h3>
          <p>In Webflow Designer, add an <strong>Embed</strong> element wherever you want the CTA, and paste:</p>
          <div className="docs-code">
            {`<div data-cta="your-slug-here"></div>`}
          </div>
          <p>Replace <code>your-slug-here</code> with the actual slug from the CTA you created.</p>

          <div className="docs-callout">
            <strong>Tip:</strong> You can copy the embed code directly from the CTA edit page — just click it to copy.
          </div>
        </>
      ),
    },
    {
      id: 'creating-ctas',
      title: 'Creating CTAs',
      content: (
        <>
          <h3>Basic Information</h3>
          <table className="data-table">
            <thead>
              <tr><th>Field</th><th>Description</th><th>Required</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>CTA Name</strong></td><td>Internal name for identification (e.g. "Q1 Promo Banner")</td><td>Yes</td></tr>
              <tr><td><strong>Slug</strong></td><td>Unique identifier used in embed codes. Auto-generated from name. Lowercase, hyphens only.</td><td>Yes</td></tr>
              <tr><td><strong>Status</strong></td><td>Active or Inactive. Inactive CTAs won't render on the site.</td><td>Yes</td></tr>
              <tr><td><strong>Scope</strong></td><td>Global, Vertical-specific, or Article-specific</td><td>Yes</td></tr>
              <tr><td><strong>Vertical</strong></td><td>Only shown when scope is "Vertical-specific". Options: Crypto, iGaming, Sportsbook, Finance, Crypto Gambling</td><td>Conditional</td></tr>
            </tbody>
          </table>

          <h3>Scheduling</h3>
          <p>
            Set optional start and end dates to control when a CTA is active. Useful for time-limited promotions.
            If no dates are set, the CTA is always active (as long as status is Active).
          </p>
          <ul>
            <li><strong>Start Date:</strong> CTA won't render before this date</li>
            <li><strong>End Date:</strong> CTA stops rendering after this date</li>
          </ul>

          <h3>Templates</h3>
          <p>Choose between standard templates or custom HTML:</p>
          <table className="data-table">
            <thead>
              <tr><th>Template</th><th>Best For</th><th>Recommended Image Size</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Banner</strong></td><td>Full-width promotional blocks with a bold heading</td><td>1200 x 400px</td></tr>
              <tr><td><strong>Card</strong></td><td>Compact, bordered cards that sit within content flow</td><td>600 x 400px</td></tr>
              <tr><td><strong>Inline</strong></td><td>Minimal, text-focused CTAs that blend with article text</td><td>No image needed</td></tr>
              <tr><td><strong>Image + Text</strong></td><td>Side-by-side layout with image on left, content on right</td><td>500 x 500px</td></tr>
            </tbody>
          </table>

          <h3>Custom HTML</h3>
          <p>
            For full control, select "Custom HTML" and write your own template. Use these variables
            (wrapped in double curly braces) — they'll be replaced with the actual CTA content:
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Variable</th><th>Outputs</th></tr>
            </thead>
            <tbody>
              <tr><td><code>{'{{heading}}'}</code></td><td>The CTA heading text</td></tr>
              <tr><td><code>{'{{body}}'}</code></td><td>The body/description text</td></tr>
              <tr><td><code>{'{{buttonText}}'}</code></td><td>Button label</td></tr>
              <tr><td><code>{'{{buttonUrl}}'}</code></td><td>Button link URL</td></tr>
              <tr><td><code>{'{{imageUrl}}'}</code></td><td>Image URL (if uploaded)</td></tr>
              <tr><td><code>{'{{imageFit}}'}</code></td><td>Image fit setting (cover, contain, fill)</td></tr>
            </tbody>
          </table>
          <p>You can also use conditional blocks to show/hide sections based on whether a variable has content:</p>
          <div className="docs-code">
{`{{#imageUrl}}
  <img src="{{imageUrl}}" alt="" />
{{/imageUrl}}`}
          </div>
          <p>This image block only renders if the user has provided an image URL.</p>

          <div className="docs-callout">
            <strong>Save as Template:</strong> After writing custom HTML you're happy with, click "Save as Template" to reuse it across other CTAs.
          </div>
        </>
      ),
    },
    {
      id: 'variants',
      title: 'Variants',
      content: (
        <>
          <p>
            Variants let you create multiple content versions within a single CTA. This is useful when
            you want to place several CTAs in one article without creating separate CTAs for each placement.
          </p>

          <h3>When to Use Variants</h3>
          <ul>
            <li>You want 3 different CTAs in one article but they all use the same template</li>
            <li>You want to test different messaging for the same CTA slot</li>
            <li>You want a top-of-article CTA and a bottom-of-article CTA with different copy</li>
          </ul>

          <h3>How It Works</h3>
          <ol>
            <li>Create or edit a CTA</li>
            <li>In the <strong>Variants</strong> section, click <strong>+ Add Variant</strong></li>
            <li>Name it something descriptive (e.g. "mid-article", "sidebar", "bottom")</li>
            <li>Fill in the content for that variant (each variant has its own heading, body, button, image per locale)</li>
          </ol>

          <h3>Embed Codes</h3>
          <p>The default variant uses the standard embed code:</p>
          <div className="docs-code">
            {`<div data-cta="your-slug"></div>`}
          </div>
          <p>Named variants add a <code>data-variant</code> attribute:</p>
          <div className="docs-code">
            {`<div data-cta="your-slug" data-variant="mid-article"></div>`}
          </div>

          <h3>Example: 3 CTAs in One Article</h3>
          <div className="docs-code">
{`<!-- Top of article — default variant -->
<div data-cta="book-demo"></div>

<!-- Middle of article -->
<div data-cta="book-demo" data-variant="mid-article"></div>

<!-- Bottom of article -->
<div data-cta="book-demo" data-variant="bottom"></div>`}
          </div>
          <p>Each variant shows its own content, but they all share the same template and analytics are tracked separately per variant.</p>
        </>
      ),
    },
    {
      id: 'locales',
      title: 'Locales / Translations',
      content: (
        <>
          <p>
            The CTA Manager supports 7 languages. The loader script automatically detects the visitor's
            language from the URL path and serves the matching content.
          </p>

          <h3>Supported Languages</h3>
          <table className="data-table">
            <thead>
              <tr><th>Code</th><th>Language</th><th>URL Pattern</th></tr>
            </thead>
            <tbody>
              <tr><td><code>en</code></td><td>English</td><td><code>/post/article-name</code> (default)</td></tr>
              <tr><td><code>ru</code></td><td>Russian</td><td><code>/ru/post/article-name</code></td></tr>
              <tr><td><code>es</code></td><td>Spanish</td><td><code>/es/post/article-name</code></td></tr>
              <tr><td><code>ko</code></td><td>Korean</td><td><code>/ko/post/article-name</code></td></tr>
              <tr><td><code>zh</code></td><td>Chinese</td><td><code>/zh/post/article-name</code></td></tr>
              <tr><td><code>ja</code></td><td>Japanese</td><td><code>/ja/post/article-name</code></td></tr>
              <tr><td><code>tr</code></td><td>Turkish</td><td><code>/tr/post/article-name</code></td></tr>
            </tbody>
          </table>

          <h3>How to Add Translations</h3>
          <ol>
            <li>In the CTA create or edit page, find the <strong>Content</strong> section</li>
            <li>Click on a locale tab (e.g. RU, ES, KO)</li>
            <li>Fill in the translated heading, body, button text, etc.</li>
            <li>Each locale can also have its own image</li>
          </ol>

          <h3>Fallback Behavior</h3>
          <div className="docs-callout">
            If a visitor's language doesn't have a translation, the CTA automatically falls back to <strong>English</strong>.
            You only need to translate the locales your content team supports — English is always required.
          </div>
        </>
      ),
    },
    {
      id: 'templates-guide',
      title: 'Templates',
      content: (
        <>
          <h3>Standard Templates</h3>
          <p>
            Four built-in templates are available, designed to match the Blockchain-Ads brand colors
            (navy <code>#1a2052</code> and orange <code>#F75C03</code>).
          </p>
          <table className="data-table">
            <thead>
              <tr><th>Template</th><th>Layout</th><th>Use Case</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Banner</strong></td><td>Full-width, dark background, centered text, prominent button</td><td>Hero-style CTAs at the top or bottom of articles</td></tr>
              <tr><td><strong>Card</strong></td><td>Bordered card with padding, vertical layout</td><td>Sidebar-style CTAs or in-content blocks</td></tr>
              <tr><td><strong>Inline</strong></td><td>Compact, horizontal layout with text and button side by side</td><td>Subtle CTAs that blend with article flow</td></tr>
              <tr><td><strong>Image + Text</strong></td><td>Two-column: image left, content right</td><td>Visual CTAs with product screenshots or graphics</td></tr>
            </tbody>
          </table>

          <h3>Editing Templates</h3>
          <p>Go to <strong>Templates</strong> in the sidebar to view and edit all templates.</p>
          <ul>
            <li>Click a template to view its HTML and CSS</li>
            <li>Edit the HTML structure and CSS styling</li>
            <li>Use the live preview to see changes in real time</li>
            <li>Click <strong>Save Changes</strong> to update</li>
          </ul>

          <div className="docs-callout">
            <strong>Important:</strong> Editing a standard template affects ALL CTAs using that template.
            If you want to change the look for just one CTA, use Custom HTML instead.
          </div>

          <h3>Custom Templates</h3>
          <p>When creating a CTA with Custom HTML, you can save it as a reusable template:</p>
          <ol>
            <li>Write your custom HTML in the CTA editor</li>
            <li>Click <strong>Save as Template</strong></li>
            <li>Give it a name</li>
            <li>It will appear in the template picker for future CTAs</li>
          </ol>

          <h3>Style Isolation</h3>
          <p>
            All CTAs render inside a <strong>Shadow DOM</strong>, which means Webflow's styles cannot
            interfere with CTA styles, and CTA styles cannot affect the rest of the page. This is automatic —
            no extra work needed.
          </p>
        </>
      ),
    },
    {
      id: 'analytics-guide',
      title: 'Analytics',
      content: (
        <>
          <h3>What Gets Tracked</h3>
          <table className="data-table">
            <thead>
              <tr><th>Metric</th><th>Description</th><th>How It's Tracked</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Impressions</strong></td><td>Number of times a CTA was seen by a visitor</td><td>Fires when 50% of the CTA is visible in the viewport</td></tr>
              <tr><td><strong>Clicks</strong></td><td>Number of times a CTA button or link was clicked</td><td>Fires on click of any link or button inside the CTA</td></tr>
              <tr><td><strong>CTR</strong></td><td>Click-through rate (clicks / impressions)</td><td>Calculated automatically</td></tr>
            </tbody>
          </table>

          <h3>Dashboard</h3>
          <p>
            The main dashboard shows an overview of all CTA performance for the last 30 days,
            including total impressions, total clicks, average CTR, active CTA count,
            and a comparison to the previous 30-day period.
          </p>

          <h3>Per-CTA Analytics</h3>
          <p>Go to <strong>Analytics</strong> in the sidebar to see detailed breakdowns:</p>
          <ul>
            <li><strong>CTA selector:</strong> Pick a specific CTA to analyze</li>
            <li><strong>Daily chart:</strong> Impressions and clicks over the last 30 days</li>
            <li><strong>Page breakdown:</strong> Which pages are driving the most views and clicks for that CTA</li>
            <li><strong>Locale breakdown:</strong> Performance by language</li>
          </ul>

          <h3>Tracking by Variant</h3>
          <p>
            Analytics are tracked per variant. If you have a CTA with 3 variants, each variant's
            impressions and clicks are counted separately, so you can compare which placement
            performs best.
          </p>

          <h3>Data Collection</h3>
          <div className="docs-callout">
            <strong>Privacy:</strong> No personal data is collected. Tracking is aggregated — we record
            CTA slug, page URL, locale, variant, and event type. No cookies, no user IDs, no IP addresses.
          </div>
        </>
      ),
    },
    {
      id: 'posts-library',
      title: 'Posts Library',
      content: (
        <>
          <p>
            The Posts Library shows which blog posts have CTA embed codes and which CTAs are active on each post.
            This data comes from the CTA usage tracking — when a CTA loads on a page, it records the page URL.
          </p>

          <h3>What You'll See</h3>
          <ul>
            <li><strong>Page URL:</strong> The blog post where a CTA was detected</li>
            <li><strong>CTA Slug:</strong> Which CTA is embedded on that page</li>
            <li><strong>Locale:</strong> The language version of the page</li>
            <li><strong>Last Seen:</strong> When the CTA was last loaded on that page</li>
          </ul>

          <div className="docs-callout">
            <strong>Note:</strong> Posts only appear here after someone visits the page and the CTA loads.
            If you just placed a CTA embed code but nobody has visited the page yet, it won't show up.
          </div>
        </>
      ),
    },
    {
      id: 'embed-reference',
      title: 'Embed Code Reference',
      content: (
        <>
          <h3>Basic Embed</h3>
          <p>Place a CTA using its slug:</p>
          <div className="docs-code">
            {`<div data-cta="your-slug"></div>`}
          </div>

          <h3>With Variant</h3>
          <p>Specify a named variant:</p>
          <div className="docs-code">
            {`<div data-cta="your-slug" data-variant="mid-article"></div>`}
          </div>

          <h3>Multiple CTAs on One Page</h3>
          <div className="docs-code">
{`<div data-cta="book-demo"></div>
<div data-cta="newsletter-signup"></div>
<div data-cta="book-demo" data-variant="bottom"></div>`}
          </div>
          <p>All CTAs on a page are fetched in a single batch request — no performance penalty for adding more.</p>

          <h3>Admin Preview Mode</h3>
          <p>Add <code>?admin-preview=true</code> to any page URL to highlight all CTAs with a purple dashed border and show their slug names. Useful for debugging.</p>
          <div className="docs-code">
            {`https://blockchain-ads.com/post/my-article?admin-preview=true`}
          </div>

          <h3>Where to Place in Webflow</h3>
          <ol>
            <li>Open the blog post (or post template) in Webflow Designer</li>
            <li>Drag an <strong>Embed</strong> element (HTML embed) to where you want the CTA</li>
            <li>Paste the embed code</li>
            <li>Publish</li>
          </ol>
        </>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <>
          <table className="data-table">
            <thead>
              <tr><th>Problem</th><th>Cause</th><th>Fix</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>CTA shows loading skeleton but never loads</td>
                <td>API error or CTA slug doesn't exist</td>
                <td>Check the browser console for errors. Verify the slug matches exactly (case-sensitive).</td>
              </tr>
              <tr>
                <td>CTA doesn't appear at all</td>
                <td>Loader script not added, or embed code is wrong</td>
                <td>Confirm the script tag is in the page's custom code. Check that the embed uses <code>data-cta</code> not <code>data-cta-id</code>.</td>
              </tr>
              <tr>
                <td>CTA shows English instead of the local language</td>
                <td>No translation exists for that locale</td>
                <td>Edit the CTA and add content for the missing locale.</td>
              </tr>
              <tr>
                <td>Styles look wrong / Webflow overriding CTA</td>
                <td>Shadow DOM not working (very rare)</td>
                <td>Check the browser console. Shadow DOM is supported in all modern browsers.</td>
              </tr>
              <tr>
                <td>CTA status is Active but it doesn't show</td>
                <td>Scheduling dates may be filtering it out</td>
                <td>Check if start/end dates are set and whether the current date falls within the window.</td>
              </tr>
              <tr>
                <td>Analytics show 0 impressions</td>
                <td>CTA isn't visible enough in the viewport</td>
                <td>Impressions fire when 50% of the CTA is visible. Scroll down to trigger it.</td>
              </tr>
              <tr>
                <td>"Failed to create CTA" error</td>
                <td>Usually a duplicate slug or missing required field</td>
                <td>Try a different slug. Make sure name, slug, and at least English content are filled in.</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
    },
  ];

  const filteredSections = searchQuery
    ? sections.filter((s) => {
        const text = s.title.toLowerCase();
        return text.includes(searchQuery.toLowerCase());
      })
    : sections;

  const activeDoc = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Documentation</h1>
          <p>Everything you need to know about managing CTAs</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px' }}>
        {/* Sidebar Navigation */}
        <div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <input
              className="form-input"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            />
          </div>
          <nav>
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); setSearchQuery(''); }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  marginBottom: '2px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: activeSection === s.id ? 'var(--accent)' : 'transparent',
                  color: activeSection === s.id ? '#fff' : 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: activeSection === s.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== s.id) (e.target as HTMLElement).style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== s.id) (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="docs-content">
          <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 700 }}>{activeDoc.title}</h2>
          {activeDoc.content}
        </div>
      </div>
    </div>
  );
}

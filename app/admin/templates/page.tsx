'use client';

import { STANDARD_TEMPLATES } from '@/lib/templates';

export default function TemplatesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Templates</h1>
          <p>Standard CTA templates available for use</p>
        </div>
      </div>

      <div className="template-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {STANDARD_TEMPLATES.map((t) => (
          <div key={t.id} className="template-card" style={{ cursor: 'default' }}>
            <h4 style={{ marginBottom: '8px' }}>{t.name}</h4>
            <p style={{ marginBottom: '16px' }}>{t.description}</p>

            {/* Live Preview */}
            <div className="preview-panel" style={{ padding: '20px', margin: 0 }}>
              <div dangerouslySetInnerHTML={{
                __html: `
                  <style>${t.css}</style>
                  ${t.htmlTemplate
                    .replace(/\{\{heading\}\}/g, 'Sample Heading')
                    .replace(/\{\{body\}\}/g, 'This is a preview of how your CTA will look with this template.')
                    .replace(/\{\{buttonText\}\}/g, 'Click Here')
                    .replace(/\{\{buttonUrl\}\}/g, '#')
                    .replace(/\{\{#imageUrl\}\}[\s\S]*?\{\{\/imageUrl\}\}/g, '')
                    .replace(/\{\{imageUrl\}\}/g, '')}
                `,
              }} />
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Template ID: <code style={{ color: 'var(--accent)' }}>{t.id}</code>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginTop: '24px',
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Custom HTML Templates</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          When creating or editing a CTA, select &quot;Custom HTML&quot; to paste your own template.
          Use these variables in your HTML:
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code style={{ color: 'var(--accent)' }}>{'{{heading}}'}</code></td><td>CTA heading text</td></tr>
            <tr><td><code style={{ color: 'var(--accent)' }}>{'{{body}}'}</code></td><td>CTA body/description text</td></tr>
            <tr><td><code style={{ color: 'var(--accent)' }}>{'{{buttonText}}'}</code></td><td>Button label</td></tr>
            <tr><td><code style={{ color: 'var(--accent)' }}>{'{{buttonUrl}}'}</code></td><td>Button link URL</td></tr>
            <tr><td><code style={{ color: 'var(--accent)' }}>{'{{imageUrl}}'}</code></td><td>Optional image URL</td></tr>
            <tr>
              <td><code style={{ color: 'var(--accent)' }}>{'{{#imageUrl}}...{{/imageUrl}}'}</code></td>
              <td>Conditional block — only renders if image URL is provided</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

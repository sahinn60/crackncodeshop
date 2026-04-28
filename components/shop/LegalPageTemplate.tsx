'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export interface LegalSection {
  id: string;
  title: { en: string; bn: string };
  content: { en: string; bn: string };
}

export interface LegalPageProps {
  title: { en: string; bn: string };
  sections: LegalSection[];
}

export default function LegalPageTemplate({ title, sections }: LegalPageProps) {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const { settings } = useSettingsStore();
  const logoUrl = settings?.logoUrl;

  return (
    <div className="legal-page" data-lang={lang}>
      {logoUrl && (
        <div className="legal-logo-wrap">
          <img src={logoUrl} alt={settings?.siteName || 'Logo'} className="legal-logo" />
        </div>
      )}

      <div className="legal-card">
        <div className="legal-header">
          <h1 className="legal-title">{title[lang]}</h1>
          <button
            onClick={() => setLang(l => (l === 'en' ? 'bn' : 'en'))}
            className="legal-lang-btn"
          >
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>

        <div className="legal-body">
          {sections.map(s => (
            <section key={s.id} className="legal-section">
              <h2 className="legal-section-title">{s.title[lang]}</h2>
              <div
                className="legal-section-content"
                dangerouslySetInnerHTML={{ __html: s.content[lang] }}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

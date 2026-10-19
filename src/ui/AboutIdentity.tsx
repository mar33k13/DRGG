import type { Lang } from '../core';
import { translations } from '../i18n';

export function AboutIdentity({ lang }: { lang: Lang }) {
  const t = translations[lang];
  return (
    <div className="about-identity">
      <div className="about-orbit" aria-hidden="true">
        <div className="orbital-grid">
          <div className="orbit-ring ring-a" />
          <div className="orbit-ring ring-b" />
          <div className="orbit-ring ring-c" />
          <div className="planet-lines">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ width: `${Math.sqrt(1 - ((i - 4) / 5) ** 2) * 100}%` }} />
            ))}
          </div>
          <div className="orbital-diamond" />
        </div>
      </div>
      <div>
        <p>
          {t.heroA} {t.heroB}
        </p>
        <span>DevRandomGameGenerator · unReason</span>
      </div>
    </div>
  );
}

// Donate page.
// Refactored: AppShell handles Sidebar + theme. Dev data moved to a constant array.

import { useEffect } from "react";
import AppShell from "@components/layout/AppShell";
import "@styles/Donate.css";

function CoffeeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const BMAC_URL = "https://buymeacoffee.com/monabu";

const DEVS = [
  { name: "Dev #1", role: "Math student",  emoji: "📐", fact: "I am trying to survive... so far so good" },
  { name: "Dev #2", role: "The other one", emoji: "💻", fact: "How do you center a div?" },
];

export default function DonatePage() {
  // Inject the Buy Me a Coffee floating widget and clean it up on unmount
  useEffect(() => {
    if (document.getElementById("bmc-widget-script")) return;
    const script = document.createElement("script");
    script.id = "bmc-widget-script";
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    script.setAttribute("data-name", "BMC-Widget");
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("data-id", "monabu");
    script.setAttribute("data-description", "Support us on Buy me a coffee!");
    script.setAttribute("data-message", "");
    script.setAttribute("data-color", "#93c5fd");
    script.setAttribute("data-position", "Right");
    script.setAttribute("data-x_margin", "18");
    script.setAttribute("data-y_margin", "18");
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.getElementById("bmc-widget-script")?.remove();
      document.getElementById("bmc-wbtn")?.remove();
    };
  }, []);

  return (
    <AppShell className="donate-page">
      <div className="donate-page__inner">
        <div className="donate-page__header">
          <div className="donate-page__eyebrow">
            <span className="donate-page__eyebrow-dot" />
            Support us
          </div>
          <h1 className="donate-page__title">
            Two people.<br />
            <em>One big project.</em>
          </h1>
          <p className="donate-page__subtitle">
            We're two people building Monabu in our spare time, fuelled by caffeine and the occasional
            existential crisis. If you find Monabu helpful and want to support our work, consider buying
            us a coffee.
          </p>
        </div>

        <div className="donate-devs">
          {DEVS.map((dev, i) => (
            <div key={i} className="donate-dev-card">
              <div className="donate-dev-card__avatar"><span>{dev.emoji}</span></div>
              <div className="donate-dev-card__info">
                <div className="donate-dev-card__name">{dev.name}</div>
                <div className="donate-dev-card__role">{dev.role}</div>
                <div className="donate-dev-card__fact">"{dev.fact}"</div>
              </div>
              <div className="donate-dev-card__links">
                <a href={BMAC_URL} target="_blank" rel="noopener noreferrer" className="donate-dev-card__link donate-dev-card__link--coffee" title="Buy me a coffee">
                  <CoffeeIcon />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="donate-bmac">
          <div className="donate-tiers__label">Support however much you'd like</div>
          <a href={BMAC_URL} target="_blank" rel="noopener noreferrer" className="donate-bmac-card">
            <div className="donate-bmac-card__left">
              <div className="donate-bmac-card__icon"><CoffeeIcon /></div>
              <div className="donate-bmac-card__text">
                <div className="donate-bmac-card__title">Buy us a coffee</div>
                <div className="donate-bmac-card__sub">Set your own amount — every contribution goes directly to us</div>
              </div>
            </div>
            <div className="donate-bmac-card__cta">buymeacoffee.com/monabu <span aria-hidden="true">→</span></div>
            <div className="donate-bmac-card__glow" />
          </a>
        </div>

        <a href="https://ko-fi.com/monabu" target="_blank" rel="noopener noreferrer" className="donate-kofi-banner">
          <div className="donate-kofi-banner__left">
            <div className="donate-kofi-banner__icon"><HeartIcon /></div>
            <div className="donate-kofi-banner__text">
              <div className="donate-kofi-banner__title">Support us on Ko-fi</div>
              <div className="donate-kofi-banner__sub">One-time or monthly — every bit counts</div>
            </div>
          </div>
          <div className="donate-kofi-banner__cta">Open Ko-fi <span aria-hidden="true">→</span></div>
          <div className="donate-kofi-banner__glow" />
        </a>
      </div>
    </AppShell>
  );
}

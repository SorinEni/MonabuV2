// Donate page.
// Refactored: AppShell handles Sidebar + theme. Dev data moved to a constant array.

import { useEffect } from "react";
import AppShell from "@components/layout/AppShell";
import PageHeader from "@components/shared/PageHeader";
import { CoffeeIcon, HeartIcon } from "@components/shared/Icons";
import "@styles/Donate.css";

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
    <AppShell>
      <div className="page-shell page-shell--narrow">
      <div className="donate-page__inner">
        <div className="donate-page__header">
          <PageHeader
            page="Donate"
            title="Two people. One big project."
            subtitle="We're two people building Monabu in our spare time, fuelled by caffeine and the occasional existential crisis. If you find Monabu helpful and want to support our work, consider buying us a coffee."
          />
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
      </div>{/* /donate-page__inner */}
      </div>{/* /page-shell */}
    </AppShell>
  );
}

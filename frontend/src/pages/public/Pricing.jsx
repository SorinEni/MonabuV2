import { useState } from "react";
import { Link } from "react-router-dom";
import { Nav, Footer, BottomCta } from "@components/shared/PublicLayout";
import {
  PricingCheckIcon,
  FaqChevronIcon,
  ShieldIcon,
} from "@components/shared/Icons";
import "@styles/Pricing.css";

//   Data

const PLANS = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    desc: "For learners just getting started.",
    cta: "Get started free",
    ctaVariant: "ghost",
    features: [
      "Up to 3 active tags",
      "Unlimited sessions",
      "30-day history",
      "Basic streak tracking",
      "CSV export",
    ],
    missing: [
      "Heatmaps & analytics",
      "Session journal",
      "Streak warnings",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: { monthly: 9, yearly: 7 },
    desc: "For serious learners who want the full picture.",
    cta: "Start 14-day trial",
    ctaVariant: "primary",
    highlight: true,
    badge: "Most popular",
    features: [
      "Unlimited tags",
      "Unlimited sessions",
      "Full history, forever",
      "Heatmaps & visual analytics",
      "Session journal with search",
      "Streak warnings & insights",
      "CSV export",
      "Priority support",
    ],
    missing: [],
  },
  {
    name: "Team",
    price: { monthly: 24, yearly: 19 },
    desc: "For study groups, bootcamps, and cohorts.",
    cta: "Contact us",
    ctaVariant: "ghost",
    features: [
      "Everything in Pro",
      "Up to 10 members",
      "Shared tag library",
      "Group leaderboard",
      "Admin dashboard",
      "Dedicated support",
    ],
    missing: [],
  },
];

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes — always. The free plan is not a trial. You can use Monabu indefinitely with up to 3 tags and 30 days of session history.",
  },
  {
    q: "What happens after the 14-day trial?",
    a: "If you choose not to continue, your account drops to the free plan automatically. You keep your data — nothing is deleted.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade or downgrade whenever you like. Upgrades are prorated; downgrades take effect at the end of your billing period.",
  },
  {
    q: "How does yearly billing work?",
    a: "Yearly plans are billed as a single upfront payment. You save roughly 20% compared to paying month-to-month.",
  },
  {
    q: "Do you offer student discounts?",
    a: "We do. Email us from your .edu address and we'll send you a 40% discount code for any paid plan.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards via Stripe. Annual plans can also be invoiced on request.",
  },
];

//   Sub-components

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`faq-item${open ? " faq-item--open" : ""}`}
      onClick={() => setOpen((o) => !o)}>
      <div className="faq-item__q">
        {q}
        <FaqChevronIcon className="faq-item__chevron" />
      </div>
      {open && <div className="faq-item__a">{a}</div>}
    </div>
  );
}

//   Page

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");

  return (
    <div className="root">
      <Nav />

      {/*   Hero   */}
      <section className="pricing-hero">
        <div className="eyebrow">
          <span className="eyebrow__dot" />
          Simple, transparent pricing
        </div>
        <h1 className="pricing-hero__heading">
          Invest in your learning.
          <br />
          Not your <em>software.</em>
        </h1>
        <p className="pricing-hero__desc">
          Start free. Upgrade when you're ready. No surprise charges, no
          feature-gating tricks.
        </p>

        <div className="billing-toggle">
          <button
            className={`billing-toggle__btn${billing === "monthly" ? " billing-toggle__btn--active" : ""}`}
            onClick={() => setBilling("monthly")}>
            Monthly
          </button>
          <button
            className={`billing-toggle__btn${billing === "yearly" ? " billing-toggle__btn--active" : ""}`}
            onClick={() => setBilling("yearly")}>
            Yearly
            <span className="billing-toggle__save">Save 20%</span>
          </button>
        </div>
      </section>

      {/*   Plans   */}
      <section className="plans">
        <div className="plans__grid">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`plan-card${plan.highlight ? " plan-card--highlight" : ""}`}>
              {plan.badge && (
                <div className="plan-card__badge">{plan.badge}</div>
              )}

              <div className="plan-card__header">
                <div className="plan-card__name">{plan.name}</div>
                <div className="plan-card__price">
                  {plan.price[billing] === 0 ? (
                    <span className="plan-card__amount">Free</span>
                  ) : (
                    <>
                      <span className="plan-card__currency">$</span>
                      <span className="plan-card__amount">
                        {plan.price[billing]}
                      </span>
                      <span className="plan-card__period">/ mo</span>
                    </>
                  )}
                </div>
                {billing === "yearly" && plan.price.yearly > 0 && (
                  <div className="plan-card__billed">
                    Billed ${plan.price.yearly * 12}/yr
                  </div>
                )}
                <p className="plan-card__desc">{plan.desc}</p>
              </div>

              <Link
                to={plan.name === "Team" ? "/contact" : "/signup"}
                className={`btn btn--${plan.ctaVariant} plan-card__cta`}>
                {plan.cta}
              </Link>

              <div className="plan-card__divider" />

              <ul className="plan-card__features">
                {plan.features.map((f) => (
                  <li key={f} className="plan-card__feature">
                    <span className="plan-card__feature-icon plan-card__feature-icon--check">
                      <PricingCheckIcon />
                    </span>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li
                    key={f}
                    className="plan-card__feature plan-card__feature--missing">
                    <span className="plan-card__feature-icon">
                      <PricingCheckIcon muted />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/*   Guarantee   */}
      <div className="guarantee">
        <ShieldIcon />
        <span>
          30-day money-back guarantee on all paid plans. No questions asked.
        </span>
      </div>

      {/*   FAQ   */}
      <section className="faq">
        <div className="faq__inner">
          <div className="faq__meta">
            <div className="section-label">FAQ</div>
            <h2 className="section-heading">
              Questions worth
              <br />
              <em>answering.</em>
            </h2>
            <p className="faq__sub">
              Still unsure? Email us at{" "}
              <a href="mailto:hello@monabu.app" className="faq__link">
                hello@monabu.app
              </a>
            </p>
          </div>
          <div className="faq__list">
            {FAQS.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </section>

      <BottomCta />
      <Footer />
    </div>
  );
}

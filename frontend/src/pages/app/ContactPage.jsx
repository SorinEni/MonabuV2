// Contact page.
// Refactored: AppShell handles Sidebar + theme boilerplate.
// Icons imported from shared Icons.jsx.

import AppShell from "@components/layout/AppShell";
import PageHeader from "@components/shared/PageHeader";
import { RedditIcon, DiscordIcon, EmailIcon } from "@components/shared/Icons";
import "@styles/Contact.css";

const CONTACT_CARDS = [
  {
    href: "https://discord.gg/jGDE7cDfS6",
    modifier: "discord",
    icon: <DiscordIcon />,
    name: "Discord",
    desc: "Chat with the team and other users in real time. Get help, share feedback, and stay up to date on new features.",
    cta: "Join the server",
  },
  {
    href: "https://reddit.com/r/monabu",
    modifier: "reddit",
    icon: <RedditIcon />,
    name: "Reddit",
    desc: "Browse discussions, share your tracking setups, and vote on feature ideas. Our subreddit is where the community lives.",
    cta: "Visit r/monabu",
  },
  {
    href: "mailto:contact@monabu.eu",
    modifier: "email",
    icon: <EmailIcon />,
    name: "Email",
    desc: "Prefer a more direct line? Send us an email and we'll get back to you within a couple of business days.",
    cta: "contact@monabu.eu",
  },
];

export default function ContactPage() {
  return (
    <AppShell>
      <div className="page-shell page-shell--narrow">
      <div className="contact-page__inner">
        <div className="contact-page__header">
          <PageHeader page="Contact" title="We'd love to hear from you" subtitle="Have a question, suggestion, or just want to say hi? Join our community or drop us a message." />
        </div>

        <div className="contact-page__cards">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.modifier}
              href={card.href}
              target={card.modifier !== "email" ? "_blank" : undefined}
              rel={card.modifier !== "email" ? "noopener noreferrer" : undefined}
              className={`contact-card contact-card--${card.modifier}`}>
              <div className="contact-card__icon">{card.icon}</div>
              <div className="contact-card__body">
                <div className="contact-card__name">{card.name}</div>
                <div className="contact-card__desc">{card.desc}</div>
                <div className="contact-card__cta">{card.cta} <span aria-hidden="true">→</span></div>
              </div>
              <div className="contact-card__glow" />
            </a>
          ))}
        </div>

        <p className="contact-page__note">
          For bug reports or feature requests, Discord is usually the fastest way to reach us.
        </p>
      </div>{/* /contact-page__inner */}
      </div>{/* /page-shell */}
    </AppShell>
  );
}

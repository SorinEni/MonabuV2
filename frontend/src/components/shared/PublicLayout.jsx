import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

//   Hook

export function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

//   Nav

const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/methodology", label: "Methodology" },
  { to: "/pricing", label: "Pricing" },
];

export function Nav() {
  const scrolled = useScrolled();
  const { pathname } = useLocation();

  return (
    <nav className={`nav${scrolled ? " nav--scrolled" : ""}`}>
      <Link to="/" className="nav__logo">
        <div className="nav__logo-mark" />
        Monabu
      </Link>
      <div className="nav__links">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`nav__link${pathname === to ? " nav__link--active" : ""}`}>
            {label}
          </Link>
        ))}
      </div>
      <div className="nav__actions">
        <Link to="/login" className="nav__login">
          Log in
        </Link>
        <Link to="/signup" className="btn btn--primary btn--sm">
          Start free →
        </Link>
      </div>
    </nav>
  );
}

//   Footer

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <Link to="/" className="footer__logo">
          Monabu
        </Link>
        <div className="footer__copy">© 2026 Monabu. All rights reserved.</div>
      </div>
    </footer>
  );
}

//   Bottom CTA

export function BottomCta() {
  return (
    <section className="bottom-cta">
      <h2 className="bottom-cta__heading">
        Start tracking what <em>matters.</em>
      </h2>
      <p className="bottom-cta__sub">Free forever. No credit card required.</p>
      <Link to="/signup" className="btn btn--primary btn--lg">
        Create your account →
      </Link>
    </section>
  );
}

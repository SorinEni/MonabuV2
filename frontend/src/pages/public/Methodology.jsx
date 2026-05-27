import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Nav, Footer } from "@components/shared/PublicLayout";
import {
  LogStepIcon,
  ReflectStepIcon,
  ReviewStepIcon,
  AdjustStepIcon,
  LoopArrowIcon,
} from "@components/shared/Icons";
import "@styles/Methodology.css";

//   Data

const PRINCIPLES = [
  {
    num: "01",
    title: "Hours are evidence, not achievement.",
    body: "Logging time is not the goal — it's the instrument. The point is to build a body of evidence about how you actually spend your attention, so you can make better decisions about where it goes next. Monabu is a mirror, not a trophy case.",
  },
  {
    num: "02",
    title: "What gets measured gets understood.",
    body: "Most people have a vague sense of how they learn. Monabu makes it precise. When you can see that you spent 40 hours on mathematics but only 8 on writing this month, you stop guessing and start choosing. Clarity is the precondition for improvement.",
  },
  {
    num: "03",
    title: "Consistency beats intensity.",
    body: "A 20-minute session logged every day compounds faster than a 3-hour marathon once a week. Streaks in Monabu aren't about pride — they're about building the neural pathways that make showing up automatic. Small and steady is the method.",
  },
  {
    num: "04",
    title: "Reflection turns repetition into growth.",
    body: "Doing the hours is necessary. Understanding what happened during them is what converts practice into skill. The session journal exists because the moment after a session — when the ideas are still warm — is when the most useful insight can be captured.",
  },
  {
    num: "05",
    title: "Structure should serve the learner, not the tool.",
    body: "You know your subjects better than we do. Tags, labels, and session names are yours to define. Monabu provides the container; you provide the meaning. No imposed categories, no mandatory workflows.",
  },
];

const THINKERS = [
  {
    name: "Anders Ericsson",
    contribution: "Deliberate practice",
    quote:
      "The right sort of practice carried out over a sufficient period of time leads to improvement.",
    detail:
      "Ericsson's research showed that expert performance is built through deliberate practice — focused, effortful repetition with clear feedback loops. Monabu is designed to support exactly this: intentional sessions, tracked over time, with the analytics to close the feedback loop.",
  },
  {
    name: "Cal Newport",
    contribution: "Deep work",
    quote:
      "To produce at your peak level you need to work for extended periods with full concentration.",
    detail:
      "Newport's framework for deep work maps directly to how Monabu thinks about sessions. A logged session is a commitment to a block of focused attention. Tracking it creates accountability and, over time, a record of your capacity for depth.",
  },
  {
    name: "Sönke Ahrens",
    contribution: "Note-taking as thinking",
    quote:
      "Writing is not the outcome of thinking; it is the medium in which thinking takes place.",
    detail:
      "The session journal in Monabu draws on Ahrens's insight that writing during and after learning isn't documentation — it's part of the learning itself. Notes taken immediately after a session capture thinking at its most alive.",
  },
  {
    name: "BJ Fogg",
    contribution: "Tiny habits",
    quote:
      "Motivation is unreliable. Design your behavior so motivation isn't required.",
    detail:
      "Fogg's research underpins Monabu's streak system. Streaks aren't about willpower — they're about reducing friction until showing up becomes the path of least resistance. A one-minute session still counts. Starting is the habit.",
  },
];

const LOOP_STEPS = [
  {
    label: "Log",
    desc: "Start a session. Tag it. Let it run.",
    icon: <LogStepIcon />,
  },
  {
    label: "Reflect",
    desc: "Write a quick note while the thinking is warm.",
    icon: <ReflectStepIcon />,
  },
  {
    label: "Review",
    desc: "Check your weekly analytics. Spot the gaps.",
    icon: <ReviewStepIcon />,
  },
  {
    label: "Adjust",
    desc: "Reallocate your time. Repeat with intent.",
    icon: <AdjustStepIcon />,
  },
];

//   Animated counter

function useCountUp(target, duration = 1200, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

function StatCounter({ num, label, suffix = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const parsed = parseInt(num.replace(/\D/g, ""), 10);
  const counted = useCountUp(parsed, 1400, visible);

  return (
    <div ref={ref} className="meth-stat">
      <div className="meth-stat__num">
        {visible ? counted.toLocaleString() : 0}
        {suffix}
      </div>
      <div className="meth-stat__label">{label}</div>
    </div>
  );
}

//   Page

export default function Methodology() {
  const [activeThinker, setActiveThinker] = useState(0);

  return (
    <div className="root">
      <Nav />

      {/*   Hero   */}
      <section className="meth-hero">
        <div className="meth-hero__inner">
          <div className="eyebrow">
            <span className="eyebrow__dot" />
            The thinking behind Monabu
          </div>
          <h1 className="meth-hero__heading">
            We have a theory
            <br />
            about how people <em>learn.</em>
          </h1>
          <p className="meth-hero__desc">
            Monabu isn't just a timer. Every decision — from how streaks work to
            why the journal exists — comes from a specific belief about what
            makes learning stick. Here's what we believe, and why.
          </p>
        </div>
      </section>

      {/*   The Loop   */}
      <section className="meth-loop">
        <div className="meth-loop__inner">
          <div className="section-label">The Monabu Loop</div>
          <h2 className="section-heading" style={{ marginBottom: "56px" }}>
            Four steps.
            <br />
            <em>Infinite improvement.</em>
          </h2>
          <div className="meth-loop__steps">
            {LOOP_STEPS.map((step, i) => (
              <div key={step.label} className="meth-loop__step">
                <div className="meth-loop__step-icon">{step.icon}</div>
                <div className="meth-loop__step-num">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="meth-loop__step-label">{step.label}</div>
                <div className="meth-loop__step-desc">{step.desc}</div>
                {i < LOOP_STEPS.length - 1 && (
                  <div className="meth-loop__arrow">
                    <LoopArrowIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*   Principles   */}
      <section className="meth-principles">
        <div className="meth-principles__inner">
          <div className="meth-principles__meta">
            <div className="section-label">Our Principles</div>
            <h2 className="section-heading">
              Five beliefs that
              <br />
              shape every feature.
            </h2>
          </div>
          <div className="meth-principles__list">
            {PRINCIPLES.map((p) => (
              <div key={p.num} className="meth-principle">
                <div className="meth-principle__num">{p.num}</div>
                <div className="meth-principle__body">
                  <div className="meth-principle__title">{p.title}</div>
                  <p className="meth-principle__text">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*   Thinkers   */}
      <section className="meth-thinkers">
        <div className="meth-thinkers__inner">
          <div className="section-label">Standing on shoulders</div>
          <h2 className="section-heading" style={{ marginBottom: "48px" }}>
            The research
            <br />
            behind the product.
          </h2>
          <div className="meth-thinkers__layout">
            <div className="meth-thinkers__tabs">
              {THINKERS.map((t, i) => (
                <button
                  key={t.name}
                  className={`meth-thinker-tab${i === activeThinker ? " meth-thinker-tab--active" : ""}`}
                  onClick={() => setActiveThinker(i)}>
                  <div className="meth-thinker-tab__name">{t.name}</div>
                  <div className="meth-thinker-tab__contrib">
                    {t.contribution}
                  </div>
                </button>
              ))}
            </div>
            <div className="meth-thinkers__panel">
              <div className="meth-thinkers__quote">
                "{THINKERS[activeThinker].quote}"
              </div>
              <div className="meth-thinkers__attribution">
                — {THINKERS[activeThinker].name}
              </div>
              <p className="meth-thinkers__detail">
                {THINKERS[activeThinker].detail}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*   Stats   */}
      <section className="meth-stats">
        <div className="meth-stats__inner">
          <StatCounter
            num="1200000"
            label="Sessions logged by Monabu users"
            suffix="+"
          />
          <StatCounter
            num="94"
            label="of Pro users hit their weekly hour goal"
            suffix="%"
          />
          <StatCounter num="312" label="Average annual hours logged per user" />
          <StatCounter num="40" label="Days — average streak length on Pro" />
        </div>
      </section>

      {/*   Manifesto closer   */}
      <section className="meth-manifesto">
        <div className="meth-manifesto__inner">
          <p className="meth-manifesto__line">
            We believe the best investment anyone can make is in their own mind.
          </p>
          <p className="meth-manifesto__line meth-manifesto__line--muted">
            And the first step to investing wisely is knowing where the time
            actually goes.
          </p>
          <Link
            to="/signup"
            className="btn btn--primary btn--lg"
            style={{ marginTop: "44px" }}>
            Start your practice →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

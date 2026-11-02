import { ArrowRight, FileText, LayoutTemplate, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "One clear story",
    description:
      "Bring your experience, projects, and skills together in one polished professional profile.",
  },
  {
    icon: LayoutTemplate,
    title: "Made to make an impression",
    description:
      "Choose a layout designed to keep your work readable, focused, and easy to scan.",
  },
  {
    icon: ShieldCheck,
    title: "Your work, your control",
    description: "Build a private profile and decide what to share when you are ready.",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="site-header">
        <a className="brand" href="/" aria-label="DevFolio home">
          <span className="brand-mark">D</span>
          <span>devfolio</span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-link" href="#features">
            Features
          </a>
          <a className="nav-link" href="#how-it-works">
            How it works
          </a>
          <a className="button button-small" href="/dashboard">
            Get started <ArrowRight size={16} aria-hidden="true" />
          </a>
        </nav>
      </header>

      <section className="hero" id="get-started">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR NEXT CHAPTER STARTS HERE
          </p>
          <h1>
            Make your work
            <br />
            <span>impossible to overlook.</span>
          </h1>
          <p className="hero-description">
            Turn your experience into a thoughtful portfolio and a CV that feels
            unmistakably yours. Clear, confident, and ready to share.
          </p>
          <div className="hero-actions">
            <a className="button" href="/dashboard">
              Create your CV <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="button button-secondary" href="/dashboard#templates">
              Explore templates
            </a>
          </div>
          <p className="hero-note">A more considered way to tell your story.</p>
        </div>

        <div className="preview-wrap" aria-label="Sample CV preview">
          <div className="preview-orbit orbit-one" />
          <div className="preview-orbit orbit-two" />
          <article className="resume-card">
            <div className="resume-topline">
              <span>SELECTED PROFILE</span>
              <span className="resume-status">AVAILABLE</span>
            </div>
            <div className="resume-heading">
              <div>
                <p className="resume-kicker">PRODUCT DESIGNER</p>
                <h2>Alex Morgan</h2>
                <p className="resume-location">Brooklyn, New York · Remote</p>
              </div>
              <div className="avatar" aria-hidden="true">
                AM
              </div>
            </div>
            <div className="resume-divider" />
            <p className="resume-label">A LITTLE ABOUT ME</p>
            <p className="resume-summary">
              I turn complex problems into thoughtful digital experiences. Curious by
              nature, collaborative by choice.
            </p>
            <div className="resume-divider" />
            <div className="resume-section-heading">
              <p className="resume-label">EXPERIENCE</p>
              <span>2021 — NOW</span>
            </div>
            <div className="resume-role">
              <span className="role-dot" />
              <div>
                <h3>Senior Product Designer</h3>
                <p>Northstar Studio · New York</p>
              </div>
            </div>
            <div className="resume-tags">
              <span>PRODUCT STRATEGY</span>
              <span>DESIGN SYSTEMS</span>
              <span>PROTOTYPING</span>
            </div>
            <div className="preview-caption">
              <span>01</span> A profile that speaks for itself
            </div>
          </article>
          <div className="floating-note">
            <span className="floating-check">✓</span>
            <span>
              <strong>Looking sharp</strong>
              <small>Ready when you are</small>
            </span>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="section-heading">
          <p className="eyebrow">A BETTER WAY TO SHOW UP</p>
          <h2>Your work deserves a little more room.</h2>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article className="feature-card" key={title}>
              <div className="feature-topline">
                <span className="feature-icon">
                  <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="feature-number">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-copy">
          <p className="eyebrow">SIMPLE BY DESIGN</p>
          <h2>Good work. Great first impression.</h2>
          <p>
            Start with your experience, shape it into a clear story, then choose a
            presentation that fits the work you want to do next.
          </p>
          <a className="text-link" href="/dashboard">
            Create your first CV <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="steps" aria-label="How DevFolio will work">
          {["Add your experience", "Make it your own", "Share with confidence"].map(
            (step, index) => (
              <div className="step" key={step}>
                <span className="step-number">0{index + 1}</span>
                <span>{step}</span>
                <ArrowRight className="step-arrow" size={17} aria-hidden="true" />
              </div>
            ),
          )}
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand" href="/" aria-label="DevFolio home">
          <span className="brand-mark">D</span>
          <span>devfolio</span>
        </a>
        <p>Make your work impossible to overlook.</p>
        <span className="footer-note">Built for what comes next.</span>
      </footer>
    </main>
  );
}

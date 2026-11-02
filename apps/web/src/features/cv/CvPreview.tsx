import { ArrowUpRight, Github, Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";

import type { CvData, CvDocument, CvTemplate } from "./model.js";

interface CvPreviewProps {
  document: Pick<CvDocument, "template"> & { data: CvData };
  className?: string;
  portfolio?: boolean;
}

const isFilled = (value: string) => value.trim().length > 0;
const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

function ContactLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function ContactDetails({ data }: { data: CvData }) {
  const { personal } = data;
  return (
    <div className="cv-contact">
      {personal.email && (
        <a href={`mailto:${personal.email}`}>
          <Mail size={13} aria-hidden="true" />
          {personal.email}
        </a>
      )}
      {personal.phone && (
        <a href={`tel:${personal.phone}`}>
          <Phone size={13} aria-hidden="true" />
          {personal.phone}
        </a>
      )}
      {personal.location && (
        <span>
          <MapPin size={13} aria-hidden="true" />
          {personal.location}
        </span>
      )}
      <ContactLink href={personal.website}>
        <Globe size={13} aria-hidden="true" />
        Website
      </ContactLink>
      <ContactLink href={personal.linkedIn}>
        <Linkedin size={13} aria-hidden="true" />
        LinkedIn
      </ContactLink>
      <ContactLink href={personal.github}>
        <Github size={13} aria-hidden="true" />
        GitHub
      </ContactLink>
    </div>
  );
}

function CvSections({ data }: { data: CvData }) {
  const experiences = data.experience.filter(
    (item) => item.company || item.role || item.responsibilities || item.achievements,
  );
  const education = data.education.filter((item) => item.institution || item.degree);
  const projects = data.projects.filter((item) => item.name || item.description);
  const certifications = data.certifications.filter((item) => item.name || item.issuer);
  const skills = data.skills.filter((item) => item.name);

  return (
    <>
      {experiences.length > 0 && (
        <section className="cv-section">
          <h2>Experience</h2>
          {experiences.map((item, index) => (
            <article className="cv-entry" key={`${item.company}-${index}`}>
              <div className="cv-entry-top">
                <h3>{item.role || item.company}</h3>
                <span>
                  {item.startDate}
                  {item.startDate && (item.endDate || item.current) ? " — " : ""}
                  {item.current ? "Present" : item.endDate}
                </span>
              </div>
              <p className="cv-entry-subtitle">
                {[item.company, item.location, item.employmentType]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {lines(item.responsibilities).length > 0 && (
                <ul>
                  {lines(item.responsibilities).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {lines(item.achievements).length > 0 && (
                <ul className="achievement-list">
                  {lines(item.achievements).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {item.technologies && (
                <p className="cv-entry-meta">Tools: {item.technologies}</p>
              )}
            </article>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className="cv-section">
          <h2>Projects</h2>
          {projects.map((item, index) => (
            <article className="cv-entry" key={`${item.name}-${index}`}>
              <div className="cv-entry-top">
                <h3>{item.name || "Project"}</h3>
                <span className="cv-project-links">
                  {item.repositoryUrl && (
                    <a href={item.repositoryUrl} target="_blank" rel="noreferrer">
                      Repository <ArrowUpRight size={11} aria-hidden="true" />
                    </a>
                  )}
                  {item.demoUrl && (
                    <a href={item.demoUrl} target="_blank" rel="noreferrer">
                      Live <ArrowUpRight size={11} aria-hidden="true" />
                    </a>
                  )}
                </span>
              </div>
              {item.description && <p>{item.description}</p>}
              {item.technologies && <p className="cv-entry-meta">{item.technologies}</p>}
            </article>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="cv-section">
          <h2>Education</h2>
          {education.map((item, index) => (
            <article className="cv-entry" key={`${item.institution}-${index}`}>
              <div className="cv-entry-top">
                <h3>{item.institution || item.degree}</h3>
                <span>
                  {item.startDate}
                  {item.startDate && item.endDate ? " — " : ""}
                  {item.endDate}
                </span>
              </div>
              <p className="cv-entry-subtitle">
                {[item.degree, item.field].filter(Boolean).join(" · ")}
              </p>
              {item.description && <p>{item.description}</p>}
            </article>
          ))}
        </section>
      )}

      {data.optionalSections.skills && skills.length > 0 && (
        <section className="cv-section">
          <h2>Skills</h2>
          <div className="cv-skills">
            {skills.map((item, index) => (
              <span className="cv-skill" key={`${item.name}-${index}`}>
                {item.name}
                {item.proficiency && <small>{item.proficiency}</small>}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.optionalSections.certifications && certifications.length > 0 && (
        <section className="cv-section">
          <h2>Certifications</h2>
          {certifications.map((item, index) => (
            <article className="cv-entry" key={`${item.name}-${index}`}>
              <div className="cv-entry-top">
                <h3>{item.name}</h3>
                <span>{item.issueDate}</span>
              </div>
              <p className="cv-entry-subtitle">
                {[item.issuer, item.expirationDate && `Expires ${item.expirationDate}`]
                  .filter(Boolean)
                  .join(" · ")}
                {item.credentialUrl && (
                  <>
                    {" · "}
                    <a href={item.credentialUrl} target="_blank" rel="noreferrer">
                      Credential
                    </a>
                  </>
                )}
              </p>
            </article>
          ))}
        </section>
      )}

      {data.optionalSections.languages && (
        <AdditionalSection title="Languages" entries={data.languages} />
      )}
      {data.optionalSections.awards && (
        <AdditionalSection title="Awards" entries={data.awards} />
      )}
      {data.optionalSections.publications && (
        <AdditionalSection title="Publications" entries={data.publications} />
      )}
      {data.optionalSections.volunteer && (
        <AdditionalSection title="Volunteer experience" entries={data.volunteer} />
      )}
    </>
  );
}

function AdditionalSection({ title, entries }: { title: string; entries: string[] }) {
  const content = entries.filter(isFilled);
  if (content.length === 0) return null;
  return (
    <section className="cv-section">
      <h2>{title}</h2>
      <ul className="cv-plain-list">
        {content.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </section>
  );
}

function ModernTemplate({ data }: { data: CvData }) {
  return (
    <article className="cv-sheet cv-template-modern">
      <header className="cv-header">
        <p className="cv-eyebrow">{data.personal.title || "Professional profile"}</p>
        <div className="cv-header-main">
          <h1>{data.personal.fullName || "Your name"}</h1>
          {data.personal.photoUrl && (
            <img
              className="cv-profile-photo"
              src={data.personal.photoUrl}
              alt={`${data.personal.fullName || "Profile"} photo`}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
        <ContactDetails data={data} />
      </header>
      {data.personal.summary && (
        <section className="cv-summary">
          <h2>Profile</h2>
          <p>{data.personal.summary}</p>
        </section>
      )}
      <CvSections data={data} />
    </article>
  );
}

function AtsTemplate({ data }: { data: CvData }) {
  return (
    <article className="cv-sheet cv-template-ats">
      <header className="cv-header">
        <h1>{data.personal.fullName || "Your name"}</h1>
        {data.personal.title && <p className="cv-ats-title">{data.personal.title}</p>}
        <ContactDetails data={data} />
      </header>
      {data.personal.summary && (
        <section className="cv-section cv-summary">
          <h2>Professional Summary</h2>
          <p>{data.personal.summary}</p>
        </section>
      )}
      <CvSections data={data} />
    </article>
  );
}

function DeveloperTemplate({ data }: { data: CvData }) {
  return (
    <article className="cv-sheet cv-template-developer">
      <header className="cv-header">
        <p className="cv-eyebrow">
          <span className="developer-prompt">~/</span> developer profile
        </p>
        <div className="cv-header-main">
          <h1>{data.personal.fullName || "Your name"}</h1>
          {data.personal.photoUrl && (
            <img
              className="cv-profile-photo"
              src={data.personal.photoUrl}
              alt={`${data.personal.fullName || "Profile"} photo`}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
        {data.personal.title && <p className="cv-dev-title">{data.personal.title}</p>}
        <ContactDetails data={data} />
      </header>
      {data.personal.summary && (
        <section className="cv-summary">
          <h2>// about</h2>
          <p>{data.personal.summary}</p>
        </section>
      )}
      <CvSections data={data} />
    </article>
  );
}

const templates: Record<CvTemplate, ({ data }: { data: CvData }) => React.JSX.Element> = {
  modern: ModernTemplate,
  ats: AtsTemplate,
  developer: DeveloperTemplate,
};

export function CvPreview({
  document,
  className = "",
  portfolio = false,
}: CvPreviewProps) {
  const Template = templates[document.template];
  return (
    <div className={`cv-preview ${className}${portfolio ? " cv-portfolio" : ""}`}>
      <Template data={document.data} />
    </div>
  );
}

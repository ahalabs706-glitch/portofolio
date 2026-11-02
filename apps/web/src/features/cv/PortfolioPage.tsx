import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { CvPreview } from "./CvPreview.js";
import { getCvDocument } from "../../lib/api.js";

export function PortfolioPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["cv-document", id],
    queryFn: () => getCvDocument(id ?? ""),
  });
  const name = query.data?.data.personal.fullName || "Portfolio preview";

  useEffect(() => {
    if (!query.data) return;
    const previousTitle = window.document.title;
    window.document.title = `${name} — Portfolio | DevFolio`;
    return () => {
      window.document.title = previousTitle;
    };
  }, [name, query.data]);

  if (query.isPending) {
    return <div className="full-page-state">Opening your portfolio preview…</div>;
  }
  if (query.isError) {
    return (
      <div className="full-page-state full-page-error" role="alert">
        <h1>We couldn’t open this portfolio.</h1>
        <p>{query.error.message}</p>
        <Link className="button" to="/dashboard">
          Back to your CVs
        </Link>
      </div>
    );
  }

  return (
    <main className="portfolio-page">
      <header className="portfolio-toolbar">
        <Link className="editor-back-link" to={`/editor/${query.data.id}`}>
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back to editor</span>
        </Link>
        <span className="portfolio-preview-label">
          Private preview · only stored in this browser
        </span>
        <button
          className="button button-small"
          type="button"
          onClick={() => window.print()}
          aria-label={`Print or save ${name} as PDF`}
        >
          <Printer size={15} aria-hidden="true" />
          Save as PDF
        </button>
      </header>
      <div className="portfolio-preview-wrap">
        <CvPreview document={query.data} portfolio />
      </div>
      <footer className="portfolio-footer">
        This is a private preview. A public, shareable portfolio isn’t available yet.
      </footer>
    </main>
  );
}

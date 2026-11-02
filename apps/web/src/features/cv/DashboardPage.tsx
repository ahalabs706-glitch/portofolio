import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Copy,
  FilePlus2,
  FileText,
  LogOut,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../auth/AuthProvider.js";
import {
  ApiError,
  createCvDocument,
  deleteCvDocument,
  duplicateCvDocument,
  listCvDocuments,
} from "../../lib/api.js";
import { createEmptyCvData } from "@devfolio/shared";
import { templateNames } from "./model.js";

const cvQueryKey = ["cv-documents"] as const;

function formattedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const auth = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const documents = useQuery({
    queryKey: cvQueryKey,
    queryFn: listCvDocuments,
    enabled: Boolean(auth.session),
  });

  const create = useMutation({ mutationFn: createCvDocument });
  const duplicate = useMutation({
    mutationFn: duplicateCvDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cvQueryKey }),
  });
  const remove = useMutation({
    mutationFn: deleteCvDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cvQueryKey }),
  });

  if (!auth.isLoading && !auth.session) return <Navigate to="/login" replace />;

  async function createNew() {
    setActionError(null);
    try {
      const document = await create.mutateAsync(createEmptyCvData());
      void queryClient.invalidateQueries({ queryKey: cvQueryKey });
      navigate(`/editor/${document.id}`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not create your CV.",
      );
      void queryClient.invalidateQueries({ queryKey: cvQueryKey });
    }
  }

  async function duplicateDocument(id: string) {
    setActionError(null);
    try {
      await duplicate.mutateAsync(id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not duplicate your CV.",
      );
      void queryClient.invalidateQueries({ queryKey: cvQueryKey });
    }
  }

  async function deleteDocument(id: string, name: string) {
    if (!window.confirm(`Delete "${name}" from your account? This cannot be undone.`))
      return;
    setActionError(null);
    try {
      await remove.mutateAsync(id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete your CV.",
      );
      void queryClient.invalidateQueries({ queryKey: cvQueryKey });
    }
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <Link className="brand" to="/" aria-label="DevFolio home">
          <span className="brand-mark">D</span>
          <span>devfolio</span>
        </Link>
        <nav aria-label="Dashboard navigation">
          <Link className="nav-link" to="/#features">
            About DevFolio
          </Link>
          <span className="workspace-avatar" aria-label={auth.session?.user.email}>
            {auth.session?.user.email.slice(0, 1).toUpperCase()}
          </span>
          <button
            className="text-button"
            type="button"
            onClick={() =>
              void auth.logout().catch(() => {
                window.alert("Sign out could not be completed. Please try again.");
              })
            }
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </nav>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-intro">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Your next opportunity starts with a story.</h1>
            <p className="dashboard-subtitle">
              Shape your experience into a clear, confident CV.
            </p>
          </div>
          <button
            className="button"
            type="button"
            onClick={createNew}
            disabled={create.isPending}
          >
            <FilePlus2 size={17} aria-hidden="true" />
            {create.isPending ? "Creating…" : "Create a CV"}
          </button>
        </div>

        {actionError && (
          <div className="dashboard-state dashboard-error" role="alert">
            {actionError}
          </div>
        )}

        <section className="dashboard-section" aria-labelledby="saved-cvs-title">
          <div className="dashboard-section-heading">
            <div>
              <h2 id="saved-cvs-title">Your CVs</h2>
              <p>Saved securely to your account.</p>
            </div>
            <span className="draft-count">
              {documents.data?.length ?? 0}{" "}
              {(documents.data?.length ?? 0) === 1 ? "document" : "documents"}
            </span>
          </div>

          {documents.isPending && (
            <div className="dashboard-state" role="status">
              Loading your CVs…
            </div>
          )}

          {documents.isError && (
            <div className="dashboard-state dashboard-error" role="alert">
              <strong>Could not load your CVs.</strong>
              <span>
                {documents.error instanceof ApiError
                  ? documents.error.message
                  : "The service is temporarily unavailable."}
              </span>
              <button
                className="text-button"
                type="button"
                onClick={() => void documents.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          {documents.isSuccess && documents.data.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={23} strokeWidth={1.6} aria-hidden="true" />
              </div>
              <h3>A blank page, full of possibility.</h3>
              <p>
                Add your experience and we’ll help you turn it into a polished,
                easy-to-share CV.
              </p>
              <button
                className="button"
                type="button"
                onClick={createNew}
                disabled={create.isPending}
              >
                {create.isPending ? "Creating…" : "Create your first CV"}{" "}
                {!create.isPending && <ArrowRight size={16} aria-hidden="true" />}
              </button>
            </div>
          )}

          {documents.isSuccess && documents.data.length > 0 && (
            <div className="cv-card-grid">
              {documents.data.map((document) => {
                const name = document.data.personal.fullName || "Untitled CV";
                return (
                  <article className="dashboard-cv-card" key={document.id}>
                    <div className={`cv-card-art cv-card-art-${document.template}`}>
                      <FileText size={25} strokeWidth={1.35} aria-hidden="true" />
                      <span>{templateNames[document.template]}</span>
                    </div>
                    <div className="dashboard-cv-card-body">
                      <h3>{name}</h3>
                      <p>{document.data.personal.title || "Add a professional title"}</p>
                      <span>Edited {formattedDate(document.updatedAt)}</span>
                      <div className="dashboard-card-actions">
                        <Link
                          className="button button-small"
                          to={`/editor/${document.id}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit
                        </Link>
                        <Link
                          className="icon-button"
                          to={`/portfolio/${document.id}`}
                          aria-label={`Preview ${name} as a portfolio`}
                          title="Portfolio preview"
                        >
                          <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Duplicate ${name}`}
                          title="Duplicate CV"
                          onClick={() => duplicateDocument(document.id)}
                          disabled={duplicate.isPending}
                        >
                          <Copy size={15} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button icon-button-danger"
                          type="button"
                          aria-label={`Delete ${name}`}
                          title="Delete CV"
                          onClick={() => deleteDocument(document.id, name)}
                          disabled={remove.isPending}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {(create.error || duplicate.error || remove.error) && (
          <div className="validation-notice dashboard-action-error" role="alert">
            {(create.error ?? duplicate.error ?? remove.error)?.message ??
              "The request could not be completed."}
          </div>
        )}

        <p className="local-data-note">
          Your CV data is stored in your account. Sign out when using a shared device.
        </p>
      </main>
    </div>
  );
}

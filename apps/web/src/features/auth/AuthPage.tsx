import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthProvider.js";
import { loginAccount, registerAccount } from "../../lib/api.js";

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const auth = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get("returnTo");
  const destination =
    returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const mutation = useMutation({
    mutationFn: () =>
      mode === "login"
        ? loginAccount(email.trim(), password)
        : registerAccount(email.trim(), password),
    onSuccess: (session) => {
      queryClient.setQueryData(["auth-session"], session);
      navigate(destination, { replace: true });
    },
  });

  if (auth.session) return <Navigate to="/dashboard" replace />;
  const isRegister = mode === "register";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegister && password !== confirmation) {
      mutation.reset();
      return;
    }
    mutation.mutate();
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" to="/" aria-label="DevFolio home">
          <span className="brand-mark">D</span>
          <span>devfolio</span>
        </Link>
        <Link className="nav-link" to={isRegister ? "/login" : "/register"}>
          {isRegister ? "Already have an account?" : "Create account"}
        </Link>
      </header>

      <section className="auth-card">
        <p className="eyebrow">{isRegister ? "A FRESH START" : "WELCOME BACK"}</p>
        <h1>
          {isRegister ? "Make room for what’s next." : "Pick up where you left off."}
        </h1>
        <p className="auth-description">
          {isRegister
            ? "Create your account to keep your CVs safe and ready wherever you work."
            : "Sign in to find your saved CVs and keep shaping your story."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label className="editor-field" htmlFor="auth-email">
            <span>Email address</span>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="editor-field" htmlFor="auth-password">
            <span>Password</span>
            <input
              id="auth-password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegister ? "At least 12 characters" : "Your password"}
            />
            {isRegister && (
              <small className="field-hint">
                Use at least 12 characters. Passwords are never stored in plain text.
              </small>
            )}
          </label>
          {isRegister && (
            <label className="editor-field" htmlFor="auth-confirm-password">
              <span>Confirm password</span>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              {confirmation && password !== confirmation && (
                <small className="field-error" role="alert">
                  Passwords do not match.
                </small>
              )}
            </label>
          )}

          {(mutation.error || auth.error) && (
            <div className="validation-notice" role="alert">
              {mutation.error?.message ??
                "We couldn’t verify your account right now. Please try again."}
            </div>
          )}

          <button
            className="button auth-submit"
            type="submit"
            disabled={
              mutation.isPending ||
              (isRegister && password !== confirmation && confirmation.length > 0)
            }
          >
            {mutation.isPending
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : "Sign in"}
            {!mutation.isPending && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to DevFolio?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
      <p className="auth-security-note">
        Your CVs are private to your account. Never share your password with anyone.
      </p>
    </main>
  );
}

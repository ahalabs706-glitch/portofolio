import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
  useLocation,
} from "react-router-dom";

import { LandingPage } from "./App.js";
import { AuthPage } from "./features/auth/AuthPage.js";
import { useAuth } from "./features/auth/AuthProvider.js";

const DashboardPage = lazy(() =>
  import("./features/cv/DashboardPage.js").then((module) => ({
    default: module.DashboardPage,
  })),
);
const EditorPage = lazy(() =>
  import("./features/cv/EditorPage.js").then((module) => ({
    default: module.EditorPage,
  })),
);
const PortfolioPage = lazy(() =>
  import("./features/cv/PortfolioPage.js").then((module) => ({
    default: module.PortfolioPage,
  })),
);

function PageLoading() {
  return (
    <div className="full-page-state" role="status">
      Opening DevFolio…
    </div>
  );
}

function NotFoundPage() {
  return (
    <main className="full-page-state">
      <p className="eyebrow">404 · NOT FOUND</p>
      <h1>This page isn’t in your story.</h1>
      <Link className="button" to="/">
        Back to DevFolio
      </Link>
    </main>
  );
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return (
      <div className="full-page-state" role="status">
        Checking your session…
      </div>
    );
  }
  if (!auth.session) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <AuthPage mode="login" /> },
  { path: "/register", element: <AuthPage mode="register" /> },
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<PageLoading />}>
        <ProtectedPage>
          <DashboardPage />
        </ProtectedPage>
      </Suspense>
    ),
  },
  {
    path: "/editor/:id",
    element: (
      <Suspense fallback={<PageLoading />}>
        <ProtectedPage>
          <EditorPage />
        </ProtectedPage>
      </Suspense>
    ),
  },
  {
    path: "/portfolio/:id",
    element: (
      <Suspense fallback={<PageLoading />}>
        <ProtectedPage>
          <PortfolioPage />
        </ProtectedPage>
      </Suspense>
    ),
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

import React, { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";

/**
 * ProtectedRoute now respects AuthContext.
 * If unauthenticated, redirect to /login.
 * While loading show a minimal loading indicator.
 */
export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuthContext();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" aria-live="polite">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  return <>{children}</>;
}

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  getSessionRedirectUrl,
  resetSessionRedirectUrl,
  setSessionRedirectUrl,
} from "@fuse/core/FuseAuthorization/sessionRedirectUrl";
import { getFuseRouteParamUtil } from "@fuse/hooks/useFuseRouteParameter";
import FuseUtils from "@fuse/utils/FuseUtils";
import { FuseRouteObjectType } from "@fuse/core/FuseLayout/FuseLayout";
import FuseLoading from "../FuseLoading";
import { useProject } from "@/context/ProjectContext";

type FuseAuthorizationProps = {
  children: React.ReactNode;
  userRole: string[] | string;
  loginRedirectUrl?: string;
};

function isUserGuest(role: string[] | string) {
  return !role || (Array.isArray(role) && role?.length === 0);
}

/**
 * FuseAuthorization handles the authorization logic of the app.
 * Refactored to a functional component to natively support useProject.
 */
function FuseAuthorization({
  children,
  userRole,
  loginRedirectUrl = "/",
}: FuseAuthorizationProps) {
  const [accessGranted, setAccessGranted] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProjectId } = useProject();

  useEffect(() => {
    const { pathname } = location;

    const auth = getFuseRouteParamUtil<FuseRouteObjectType["auth"]>(
      pathname,
      "auth",
      false,
    );
    const ignoredPaths = [
      "/",
      "/callback",
      "/sign-in",
      "/sign-out",
      "/logout",
      "/404",
      "/401",
      "/select-project",
      "/portal",
      "/users",
    ];

    // Business users never need a project — let them navigate freely within /businesses/*
    const isBusinessPath = pathname.startsWith('/businesses');

    const isOnlyGuestAllowed = Array.isArray(auth) && auth.length === 0;
    const isGuest = isUserGuest(userRole);

    const rawUserRoles = Array.isArray(userRole) ? userRole : [userRole];
    const normalizedUserRoles = rawUserRoles.map(r => typeof r === 'string' ? r.toLowerCase() : r);
    const normalizedUserRoleProp = Array.isArray(userRole) ? normalizedUserRoles : (normalizedUserRoles[0] || userRole);

    const userHasPermission = FuseUtils.hasPermission(auth, normalizedUserRoleProp);

    if (auth && !userHasPermission && !ignoredPaths.includes(pathname)) {
      setSessionRedirectUrl(pathname);
    }

    if (!userHasPermission && !isGuest && !ignoredPaths.includes(pathname)) {
      if (isOnlyGuestAllowed) {
        setSessionRedirectUrl("/");
      } else {
        setSessionRedirectUrl("401");
      }
    }

    const newAccessGranted = auth ? userHasPermission : true;
    setAccessGranted(newAccessGranted);

    const isBusinessUser = normalizedUserRoles.includes("businesses");

    // --- Routing Logic ---
    if (!newAccessGranted) {
      const redirectUrl = getSessionRedirectUrl() || loginRedirectUrl;

      if (isGuest) {
        setTimeout(() => navigate("/sign-in"), 0);
      } else {
        setTimeout(() => navigate(redirectUrl), 0);
        resetSessionRedirectUrl();
      }
    } else if (!isGuest && !isBusinessUser) {
      // User is logged in and authorized for this route.
      // Check Project Context (Business users bypass this)
      if (
        !activeProjectId &&
        pathname !== "/select-project" &&
        !ignoredPaths.includes(pathname) &&
        !isBusinessPath
      ) {
        // Not in a project workspace, must select one first
        setTimeout(() => navigate("/select-project"), 0);
      }
    }
  }, [
    location.pathname,
    userRole,
    activeProjectId,
    navigate,
    loginRedirectUrl,
  ]);

  return accessGranted ? children : <FuseLoading />;
}

export default FuseAuthorization;

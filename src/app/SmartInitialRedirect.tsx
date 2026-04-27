import { Navigate } from 'react-router';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import FuseLoading from '@fuse/core/FuseLoading';

/**
 * SmartInitialRedirect
 * 
 * Redirects the user to the appropriate dashboard based on their role.
 * Businesses go directly to /businesses.
 * Others go to /select-project.
 */
function SmartInitialRedirect() {
	const { authState } = useAuth();

	if (!authState || authState.authStatus === 'configuring') {
		return <FuseLoading />;
	}

	if (!authState.isAuthenticated || !authState.user) {
		return <Navigate to="/sign-in" />;
	}

	const user = authState.user;
	const rawRoles = Array.isArray(user.role) ? user.role : [user.role];
	const roles = rawRoles.map(r => typeof r === 'string' ? r.toLowerCase() : r);
	
	if (roles.includes('businesses')) {
		return <Navigate to="/businesses" />;
	}

	return <Navigate to="/select-project" />;
}

export default SmartInitialRedirect;

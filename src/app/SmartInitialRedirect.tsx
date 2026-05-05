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

	return <Navigate to="/portal" />;
}

export default SmartInitialRedirect;

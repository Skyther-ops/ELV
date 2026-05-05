import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';
import SignInPageView from './components/views/SignInPageView';
import SignUpPageView from './components/views/SignUpPageView';
import SignOutPageView from './components/views/SignOutPageView';

const noLayoutConfig = {
    layout: {
        config: {
            navbar: { display: false },
            toolbar: { display: false },
            footer: { display: false },
            leftSidePanel: { display: false },
            rightSidePanel: { display: false }
        }
    }
};

const route: FuseRouteItemType = {
    children: [
        // Unified login page
        {
            path: 'sign-in',
            element: <SignInPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        {
            path: 'sign-up',
            element: <SignUpPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        {
            path: 'sign-out',
            element: <SignOutPageView />,
            settings: noLayoutConfig,
            auth: null
        }
    ]
};

export default route;

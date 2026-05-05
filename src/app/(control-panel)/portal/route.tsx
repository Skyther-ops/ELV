import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import settingsConfig from '@/configs/settingsConfig';
import PortalPage from './PortalPage';

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
    path: 'portal',
    element: <PortalPage />,
    settings: noLayoutConfig,
    auth: settingsConfig.defaultAuth
};

export default route;

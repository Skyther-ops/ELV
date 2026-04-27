import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const TendersPage             = lazy(() => import('./TendersPage'));
const MasterListPage          = lazy(() => import('./MasterListPage'));
const TenderCostingPage       = lazy(() => import('./TenderCostingPage'));
const ProjectMasterListPage   = lazy(() => import('./ProjectMasterListPage'));

const routes: FuseRouteItemType[] = [
    {
        path: 'businesses',
        element: <TendersPage />,
        auth: ['businesses', 'superadmin', 'admin']
    },
    {
        path: 'businesses/tenders',
        element: <TendersPage />,
        auth: ['businesses', 'superadmin', 'admin']
    },
    {
        path: 'businesses/master-list',
        element: <MasterListPage />,
        auth: ['businesses', 'superadmin', 'admin']
    },
    {
        path: 'businesses/project-master-list',
        element: <ProjectMasterListPage />,
        auth: ['businesses', 'superadmin', 'admin']
    },
    {
        path: 'businesses/tenders/:id/costing',
        element: <TenderCostingPage />,
        auth: ['businesses', 'superadmin', 'admin']
    }
];

export default routes;

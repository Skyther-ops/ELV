import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const TendersPage             = lazy(() => import('./TendersPage'));
const MasterListPage          = lazy(() => import('./MasterListPage'));
const TenderCostingPage       = lazy(() => import('./TenderCostingPage'));
const ProjectMasterListPage   = lazy(() => import('./ProjectMasterListPage'));
const TenderDashboardPage     = lazy(() => import('./TenderDashboardPage'));
const LicenseTrackingPage     = lazy(() => import('./LicenseTrackingPage'));

const routes: FuseRouteItemType[] = [
    {
        path: 'businesses',
        element: <TenderDashboardPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    },
    {
        path: 'businesses/dashboard',
        element: <TenderDashboardPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    },
    {
        path: 'businesses/tenders',
        element: <TendersPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    },
    {
        path: 'businesses/master-list',
        element: <MasterListPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    },
    {
        path: 'businesses/project-master-list',
        element: <ProjectMasterListPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    },
    {
        path: 'businesses/tenders/:id/costing',
        element: <TenderCostingPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    },
    {
        path: 'businesses/license-tracking',
        element: <LicenseTrackingPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor']
    }
];

export default routes;


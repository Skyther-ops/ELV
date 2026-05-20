import { lazy } from 'react';

const UsersPage = lazy(() => import('./UsersPage'));

const usersRoutes = [
    {
        path: 'management/users',
        element: <UsersPage />,
        auth: ['supervisor', 'business_admin', 'business_higher_admin']
    }
];

export default usersRoutes;

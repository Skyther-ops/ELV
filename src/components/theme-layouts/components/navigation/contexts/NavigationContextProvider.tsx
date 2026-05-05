import { ReactNode, useCallback, useState, useEffect, useMemo } from 'react';
import { FuseFlatNavItemType, FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import navigationConfig from '@/configs/navigationConfig';
import FuseNavItemModel from '@fuse/core/FuseNavigation/models/FuseNavItemModel';
import { PartialDeep } from 'type-fest';
import { NavigationContext } from '@/components/theme-layouts/components/navigation/contexts/NavigationContext';
import { useProject } from '@/context/ProjectContext';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';

export function NavigationContextProvider({ children }: { children: ReactNode }) {
	const { viewMode } = useProject();
	const { authState } = useAuth();

	// Detect business role
	const isBusinessUser = useMemo(() => {
		const role = authState?.user?.role;
		if (!role) return false;
		const roles = Array.isArray(role) ? role : [role];
		return roles.some(r => typeof r === 'string' && r.toLowerCase() === 'businesses');
	}, [authState?.user?.role]);

	const filteredNavigationConfig = useMemo(() => {
		// Always include the Switch System button for authorized roles
		const baseItems = navigationConfig.filter(item => item.id === 'switch-system');
		
		if (isBusinessUser) {
			// Business users only see their own group + Switch System
			return navigationConfig.filter(item => ['businesses-group', 'switch-system'].includes(item.id));
		}

		// Detect if we should show business menu for supervisors/admins
		const role = authState?.user?.role;
		const roles = Array.isArray(role) ? role : [role];
		const isAdminOrSupervisor = roles.some(r => ['supervisor', 'superadmin', 'admin'].includes(String(r).toLowerCase()));

		if (viewMode === 'business' && isAdminOrSupervisor) {
			// Business mode shows Business Management and Management
			return navigationConfig.filter(item => ['businesses-group', 'management-group', 'switch-system'].includes(item.id));
		}

		if (viewMode === 'ssdc') {
			// Only show SSDC Ops and Management
			return navigationConfig.filter(item =>
				['ssdc-operations-group', 'management-group', 'switch-system'].includes(item.id)
			);
		} else {
			// Only show Construction/Building related and Management
			return navigationConfig.filter(item =>
				['inventory-group', 'building-group', 'scheduling-group', 'management-group', 'switch-system'].includes(item.id)
			);
		}
	}, [viewMode, isBusinessUser, authState?.user?.role]);

	const [navigationItems, setNavigationItems] = useState<FuseFlatNavItemType[]>(
		FuseNavigationHelper.flattenNavigation(filteredNavigationConfig)
	);

	useEffect(() => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(filteredNavigationConfig));
	}, [filteredNavigationConfig]);

	const setNavigation = useCallback((items: FuseNavItemType[]) => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(items));
	}, []);

	const appendNavigationItem = useCallback(
		(item: FuseNavItemType, parentId?: string | null) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.appendNavItem(navigation, FuseNavItemModel(item), parentId));
		},
		[navigationItems, setNavigation]
	);

	const prependNavigationItem = useCallback(
		(item: FuseNavItemType, parentId?: string | null) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.prependNavItem(navigation, FuseNavItemModel(item), parentId));
		},
		[navigationItems, setNavigation]
	);

	const updateNavigationItem = useCallback(
		(id: string, item: PartialDeep<FuseNavItemType>) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.updateNavItem(navigation, id, item));
		},
		[navigationItems, setNavigation]
	);

	const removeNavigationItem = useCallback(
		(id: string) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.removeNavItem(navigation, id));
		},
		[navigationItems, setNavigation]
	);

	const resetNavigation = useCallback(() => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(filteredNavigationConfig));
	}, [filteredNavigationConfig]);

	const getNavigationItemById = useCallback(
		(id: string) => navigationItems.find((item) => item.id === id),
		[navigationItems]
	);

	const value = {
		setNavigation,
		navigationItems,
		appendNavigationItem,
		prependNavigationItem,
		updateNavigationItem,
		removeNavigationItem,
		resetNavigation,
		getNavigationItemById
	};

	return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

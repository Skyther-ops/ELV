'use client';

import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useEffect, useState } from 'react';
import useUser from '@auth/useUser';
import { authFetchUsers, authAddUser, authUpdateUserStatus, authDeleteUser } from '@auth/authApi';
import { User } from '@auth/user';
import {
    Avatar,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Switch,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';

const ROLES = {
    superadmin: { label: 'Super Admin', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', dot: 'bg-rose-500' },
    supervisor: { label: 'Supervisor', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', dot: 'bg-violet-500' },
    facilitator: { label: 'Facilitator', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
    member: { label: 'Member', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', dot: 'bg-sky-500' },
    businesses: { label: 'Business Member', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
    business_admin: { label: 'Business Admin', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', dot: 'bg-indigo-500' },
    business_higher_admin: { label: 'Business Higher Admin', chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', dot: 'bg-teal-500' },
};

function getRole(user: User): string {
    const r = Array.isArray(user.role) ? user.role[0] : user.role;
    return (r as string) || 'member';
}

function RoleBadge({ role }: { role: string }) {
    const meta = ROLES[role as keyof typeof ROLES] ?? ROLES.member;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${meta.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

export default function UsersPage() {
    const { data: currentUser } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Add dialog
    const [openAdd, setOpenAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
    const [submitting, setSubmitting] = useState(false);

    // Edit role dialog
    const [editTarget, setEditTarget] = useState<User | null>(null);
    const [editRole, setEditRole] = useState('member');
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            setUsers(await authFetchUsers());
        } catch {
            enqueueSnackbar('Failed to load users', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (user: User) => {
        try {
            const { user: u } = await authUpdateUserStatus(user.id, { isBlocked: !user.isBlocked });
            setUsers(p => p.map(x => x.id === user.id ? u : x));
            enqueueSnackbar(u.isBlocked ? 'User blocked' : 'User unblocked', { variant: 'info' });
        } catch {
            enqueueSnackbar('Failed to update user', { variant: 'error' });
        }
    };

    const handleAddUser = async () => {
        setSubmitting(true);
        try {
            const { user: u } = await authAddUser(form);
            setUsers(p => [...p, u]);
            enqueueSnackbar('User created', { variant: 'success' });
            setOpenAdd(false);
            setForm({ name: '', email: '', password: '', role: defaultAddRole });
        } catch {
            enqueueSnackbar('Failed to create user', { variant: 'error' });
        } finally { setSubmitting(false); }
    };

    const handleSaveRole = async () => {
        if (!editTarget) return;
        setEditSubmitting(true);
        try {
            const { user: u } = await authUpdateUserStatus(editTarget.id, { role: editRole });
            setUsers(p => p.map(x => x.id === editTarget.id ? u : x));
            enqueueSnackbar('Role updated', { variant: 'success' });
            setEditTarget(null);
        } catch {
            enqueueSnackbar('Failed to update role', { variant: 'error' });
        } finally { setEditSubmitting(false); }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget) return;
        setDeleteSubmitting(true);
        try {
            await authDeleteUser(deleteTarget.id);
            setUsers(p => p.filter(x => x.id !== deleteTarget.id));
            enqueueSnackbar('User deleted', { variant: 'success' });
            setDeleteTarget(null);
        } catch {
            enqueueSnackbar('Failed to delete user', { variant: 'error' });
        } finally { setDeleteSubmitting(false); }
    };

    const currentUserRole = currentUser?.role;
    const currentUserRoles = Array.isArray(currentUserRole) 
        ? currentUserRole 
        : (typeof currentUserRole === 'string' ? [currentUserRole] : []);
    
    const isGlobalManager = currentUserRoles.some(r => ['supervisor', 'superadmin', 'admin'].includes(r));
    const isBusinessManager = currentUserRoles.some(r => ['business_admin', 'business_higher_admin'].includes(r));
    const isSupervisor = isGlobalManager || isBusinessManager;
    const defaultAddRole = (isBusinessManager && !isGlobalManager) ? 'businesses' : 'member';

    const viewableUsers = users.filter(u => {
        if (isBusinessManager && !isGlobalManager) {
            const role = getRole(u);
            return ['businesses', 'business_admin', 'business_higher_admin'].includes(role);
        }
        return true;
    });

    const filtered = viewableUsers.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        const matchRole = filterRole === 'all' || getRole(u) === filterRole;
        return matchSearch && matchRole;
    });

    const counts = {
        all: viewableUsers.length,
        superadmin: viewableUsers.filter(u => getRole(u) === 'superadmin').length,
        supervisor: viewableUsers.filter(u => getRole(u) === 'supervisor').length,
        facilitator: viewableUsers.filter(u => getRole(u) === 'facilitator').length,
        member: viewableUsers.filter(u => getRole(u) === 'member').length,
        businesses: viewableUsers.filter(u => getRole(u) === 'businesses').length,
        business_admin: viewableUsers.filter(u => getRole(u) === 'business_admin').length,
        business_higher_admin: viewableUsers.filter(u => getRole(u) === 'business_higher_admin').length,
    };

    if (loading) return <FuseLoading />;

    if (!isSupervisor) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <FuseSvgIcon size={24} className="text-gray-400">heroicons-outline:lock-closed</FuseSvgIcon>
                </div>
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Access Denied</p>
                <p className="text-xs text-gray-400">Only authorized supervisors and business managers can manage users.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">

            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-20 pt-16 pb-12 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
                <div>
                    <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">User Management</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">Manage accounts, roles and access</p>
                </div>
                <button
                    onClick={() => { setForm({ name: '', email: '', password: '', role: defaultAddRole }); setOpenAdd(true); }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                    <FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>
                    Add User
                </button>
            </div>

            {/* ── Filter tabs + search ── */}
            <div className="px-20 py-10 flex items-center gap-8 shrink-0">
                {/* Role tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
                    {((isBusinessManager && !isGlobalManager)
                        ? (['all', 'businesses', 'business_admin', 'business_higher_admin'] as const)
                        : (['all', 'superadmin', 'supervisor', 'facilitator', 'member', 'businesses', 'business_admin', 'business_higher_admin'] as const)
                    ).map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRole(r)}
                            className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${
                                filterRole === r
                                    ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                        >
                            {r === 'all' ? 'All' : (r === 'superadmin' ? 'Super Admin' : r === 'business_admin' ? 'Business Admin' : r === 'business_higher_admin' ? 'Business Higher Admin' : r === 'businesses' ? 'Business Member' : r)}
                            <span className={`ml-1.5 text-[10px] font-black ${filterRole === r ? 'text-blue-600' : 'text-gray-400'}`}>
                                {counts[r]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <FuseSvgIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        heroicons-outline:magnifying-glass
                    </FuseSvgIcon>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <FuseSvgIcon size={12}>heroicons-outline:x-mark</FuseSvgIcon>
                        </button>
                    )}
                </div>

                <span className="ml-auto text-[11px] text-gray-400">
                    {filtered.length} / {users.length} users
                </span>
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto px-20 pb-16">

                {/* Header row */}
                <div className="grid items-center px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
                    style={{ gridTemplateColumns: '1fr 100px 80px 130px 56px 64px' }}>
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Last Seen</span>
                    <span>Block</span>
                    <span>Actions</span>
                </div>

                {/* User rows */}
                <div className="bg-white dark:bg-[#1a1a1e] rounded-xl border border-gray-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <FuseSvgIcon size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2">heroicons-outline:users</FuseSvgIcon>
                            <p className="text-xs text-gray-400">{search ? 'No results found.' : 'No users yet.'}</p>
                        </div>
                    ) : filtered.map((user, i) => {
                        const role = getRole(user);
                        const isSelf = user.id === currentUser?.id;
                        const lastSeen = user.lastSeenAt
                            ? formatDistanceToNow(new Date(user.lastSeenAt), { addSuffix: true })
                            : '—';

                        return (
                            <div
                                key={user.id}
                                className={`grid items-center px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                                    i < filtered.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.05]' : ''
                                }`}
                                style={{ gridTemplateColumns: '1fr 100px 80px 130px 56px 64px' }}
                            >
                                {/* User info */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar
                                        src={user.photoURL}
                                        sx={{ width: 30, height: 30, fontSize: '0.7rem', flexShrink: 0, bgcolor: '#6366f1' }}
                                    >
                                        {user.displayName?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                                                {user.displayName}
                                            </span>
                                            {isSelf && (
                                                <span className="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-gray-400 truncate block">{user.email}</span>
                                    </div>
                                </div>

                                {/* Role */}
                                <div><RoleBadge role={role} /></div>

                                {/* Status */}
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    <span className={`text-[11px] font-semibold ${user.isBlocked ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                    </span>
                                </div>

                                {/* Last seen */}
                                <span className="text-[11px] text-gray-400 truncate">{lastSeen}</span>

                                {/* Block toggle */}
                                <Tooltip title={isSelf ? "Can't block yourself" : user.isBlocked ? 'Unblock' : 'Block'} placement="top">
                                    <span>
                                        <Switch
                                            checked={!!user.isBlocked}
                                            onChange={() => handleToggleBlock(user)}
                                            size="small"
                                            disabled={isSelf}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef4444' },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#fca5a5' },
                                                opacity: isSelf ? 0.3 : 1,
                                            }}
                                        />
                                    </span>
                                </Tooltip>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <Tooltip title="Change role" placement="top">
                                        <button
                                            onClick={() => { setEditRole(role); setEditTarget(user); }}
                                            disabled={isSelf}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                                        >
                                            <FuseSvgIcon size={13}>heroicons-outline:pencil</FuseSvgIcon>
                                        </button>
                                    </Tooltip>
                                    <Tooltip title={isSelf ? "Can't delete yourself" : 'Delete user'} placement="top">
                                        <button
                                            onClick={() => setDeleteTarget(user)}
                                            disabled={isSelf}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                                        >
                                            <FuseSvgIcon size={13}>heroicons-outline:trash</FuseSvgIcon>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ Add User Dialog ═══ */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs"
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <div className="px-6 pt-5 pb-1">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Create New User</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Add a new team member to the system</p>
                </div>
                <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                    <div className="flex flex-col gap-3">
                        <TextField label="Full Name" fullWidth size="small" value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            autoFocus
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }} />
                        <TextField label="Email" fullWidth size="small" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }} />
                        <TextField label="Password" type="password" fullWidth size="small" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }} />
                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }}>
                            <InputLabel>Role</InputLabel>
                            <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value })}>
                                {!(isBusinessManager && !isGlobalManager) && <MenuItem value="superadmin">Super Admin</MenuItem>}
                                {!(isBusinessManager && !isGlobalManager) && <MenuItem value="supervisor">Supervisor</MenuItem>}
                                {!(isBusinessManager && !isGlobalManager) && <MenuItem value="facilitator">Facilitator</MenuItem>}
                                {!(isBusinessManager && !isGlobalManager) && <MenuItem value="member">Member</MenuItem>}
                                <MenuItem value="businesses">Business Member</MenuItem>
                                <MenuItem value="business_admin">Business Admin</MenuItem>
                                <MenuItem value="business_higher_admin">Business Higher Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <button onClick={() => setOpenAdd(false)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleAddUser}
                        disabled={submitting || !form.name || !form.email || !form.password}
                        className="text-xs font-bold px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
                        {submitting ? 'Creating…' : 'Create User'}
                    </button>
                </DialogActions>
            </Dialog>

            {/* ═══ Edit Role Dialog ═══ */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} fullWidth maxWidth="xs"
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <div className="px-6 pt-5 pb-1">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Change Role</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Updating role for <strong className="text-gray-600 dark:text-gray-200">{editTarget?.displayName}</strong>
                    </p>
                </div>
                <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
                    <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '13px' } }}>
                        <InputLabel>New Role</InputLabel>
                        <Select value={editRole} label="New Role" onChange={e => setEditRole(e.target.value)}>
                            {!(isBusinessManager && !isGlobalManager) && <MenuItem value="superadmin">Super Admin</MenuItem>}
                            {!(isBusinessManager && !isGlobalManager) && <MenuItem value="supervisor">Supervisor</MenuItem>}
                            {!(isBusinessManager && !isGlobalManager) && <MenuItem value="facilitator">Facilitator</MenuItem>}
                            {!(isBusinessManager && !isGlobalManager) && <MenuItem value="member">Member</MenuItem>}
                            <MenuItem value="businesses">Business Member</MenuItem>
                            <MenuItem value="business_admin">Business Admin</MenuItem>
                            <MenuItem value="business_higher_admin">Business Higher Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <button onClick={() => setEditTarget(null)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSaveRole} disabled={editSubmitting}
                        className="text-xs font-bold px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
                        {editSubmitting ? 'Saving…' : 'Save'}
                    </button>
                </DialogActions>
            </Dialog>

            {/* ═══ Delete Dialog ═══ */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs"
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <div className="px-6 pt-5 pb-1 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 mt-0.5">
                        <FuseSvgIcon size={18} className="text-red-500">heroicons-outline:trash</FuseSvgIcon>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Delete User</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                            Permanently delete <strong className="text-gray-600 dark:text-gray-200">{deleteTarget?.displayName}</strong>?
                            This cannot be undone.
                        </p>
                    </div>
                </div>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <button onClick={() => setDeleteTarget(null)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleDeleteUser} disabled={deleteSubmitting}
                        className="text-xs font-bold px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
                        {deleteSubmitting ? 'Deleting…' : 'Delete'}
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

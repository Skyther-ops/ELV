'use client';
import { FC, useState, useMemo } from 'react';
import {
    Typography, Paper, Button, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Tooltip,
    CircularProgress, useTheme
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay,
    eachDayOfInterval, isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import {
    useAttendance, useAddAttendance, useUpdateAttendance,
    useDeleteAttendance, useUpsertPersonalRemark, useUsers,
    AttendanceRecord
} from './attendanceApi';
import { enqueueSnackbar } from 'notistack';
import useJwtAuth from '@auth/services/jwt/useJwtAuth';

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIFTS = [
    'Morning', 'Night',
    'Rest day', 'Off day',
    'Walk on rest day morning', 'Walk on rest day night',
    'Annual leave', 'OST', 'PH (public holiday)', 'MC', 'Note'
];

const SHIFT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'Morning':                   { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    'Night':                     { bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
    'Rest day':                  { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
    'Off day':                   { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
    'Walk on rest day morning':  { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
    'Walk on rest day night':    { bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6' },
    'Annual leave':              { bg: '#ffedd5', text: '#9a3412', dot: '#f97316' },
    'OST':                       { bg: '#f1f5f9', text: '#475569', dot: '#64748b' },
    'PH (public holiday)':       { bg: '#f3e8ff', text: '#6b21a8', dot: '#a855f7' },
    'MC':                        { bg: '#ffe4e6', text: '#9f1239', dot: '#f43f5e' },
    'Note':                      { bg: '#fafafa', text: '#64748b', dot: '#cbd5e1' },
};

const getShiftStyle = (s: string) =>
    SHIFT_COLORS[s] ?? { bg: '#eef2ff', text: '#3730a3', dot: '#6366f1' };

// ─── Sub-components ───────────────────────────────────────────────────────────

const ShiftBadge: FC<{ status: string; size?: 'sm' | 'xs' }> = ({ status, size = 'sm' }) => {
    const c = getShiftStyle(status);
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider ${size === 'xs' ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'}`}
            style={{ backgroundColor: c.bg, color: c.text }}
        >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: c.dot }} />
            {status}
        </span>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AttendancePage: FC = () => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const { user } = useJwtAuth();
    const role = (user as any)?.role ?? '';
    const isSupervisor = role.includes('supervisor') || role.includes('superadmin') || role.includes('admin'); 
    const myUserId = String((user as any)?.id ?? '');
    const myName   = (user as any)?.name ?? 'Me';

    // ── State ──────────────────────────────────────────────────────────────────
    const [tab, setTab] = useState<0 | 1>(0); // 0 = My Schedule, 1 = Team
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Dialogs
    const [remarkDialog, setRemarkDialog] = useState<{ open: boolean; date: Date | null; existing?: AttendanceRecord }>({ open: false, date: null });
    const [shiftDialog, setShiftDialog]   = useState<{ open: boolean; date: Date | null }>({ open: false, date: null });

    // Dialog form state
    const [remarkText, setRemarkText]   = useState('');
    const [shiftUserId, setShiftUserId] = useState<string>('');
    const [shiftStatus, setShiftStatus] = useState(SHIFTS[0]);
    const [shiftRecord, setShiftRecord] = useState<AttendanceRecord | null>(null); // for editing existing

    // ── Data ───────────────────────────────────────────────────────────────────
    const monthKey = format(currentMonth, 'yyyy-MM');
    const { data: records = [], isLoading } = useAttendance(activeProjectId, monthKey);
    const { data: users = [] } = useUsers();
    const addAttendance    = useAddAttendance();
    const updateAttendance = useUpdateAttendance();
    const deleteAttendance = useDeleteAttendance();
    const upsertRemark     = useUpsertPersonalRemark();

    // ── Derived ────────────────────────────────────────────────────────────────
    const monthStart  = startOfMonth(currentMonth);
    const monthEnd    = endOfMonth(monthStart);
    const calStart    = startOfWeek(monthStart);
    const calEnd      = endOfWeek(monthEnd);
    const calendarDays = useMemo(() => eachDayOfInterval({ start: calStart, end: calEnd }), [calStart, calEnd]);

    const recordsByDate = useMemo(() => {
        const map: Record<string, AttendanceRecord[]> = {};
        records.forEach(r => {
            if (!map[r.date]) map[r.date] = [];
            map[r.date].push(r);
        });
        return map;
    }, [records]);

    // Only MY records
    const myRecordsByDate = useMemo(() => {
        const map: Record<string, AttendanceRecord[]> = {};
        records.filter(r => String(r.user_id) === myUserId).forEach(r => {
            if (!map[r.date]) map[r.date] = [];
            map[r.date].push(r);
        });
        return map;
    }, [records, myUserId]);

    const activeRecords = tab === 0 ? myRecordsByDate : recordsByDate;

    // ── Navigation ─────────────────────────────────────────────────────────────
    const goPrev  = () => setCurrentMonth(m => subMonths(m, 1));
    const goNext  = () => setCurrentMonth(m => addMonths(m, 1));
    const goToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

    // ── Handlers ───────────────────────────────────────────────────────────────

    const openRemarkDialog = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Personal notes are stored as 'Note' status records with remarks field
        const existing = myRecordsByDate[dateStr]?.find(r => r.status === 'Note' && r.remarks);
        setRemarkText(existing?.remarks ?? existing?.personal_remark ?? '');
        setRemarkDialog({ open: true, date, existing });
    };

    const handleSaveRemark = async () => {
        if (!remarkDialog.date || !activeProjectId) return;
        try {
            await upsertRemark.mutateAsync({
                user_id: myUserId,
                user_name: myName,
                project_id: activeProjectId,
                date: format(remarkDialog.date, 'yyyy-MM-dd'),
                personal_remark: remarkText,
            });
            enqueueSnackbar('Personal remark saved!', { variant: 'success' });
            setRemarkDialog({ open: false, date: null });
        } catch {
            enqueueSnackbar('Failed to save remark', { variant: 'error' });
        }
    };

    const openShiftDialog = (date: Date, existingRecord?: AttendanceRecord) => {
        setShiftRecord(existingRecord ?? null);
        setShiftUserId(existingRecord ? String(existingRecord.user_id) : '');
        setShiftStatus(existingRecord?.status ?? SHIFTS[0]);
        setShiftDialog({ open: true, date });
    };

    const handleSaveShift = async () => {
        if (!shiftDialog.date || !activeProjectId) return;
        const targetUser = users.find(u => String(u.id) === String(shiftUserId));
        if (!targetUser && !shiftRecord) return;

        try {
            if (shiftRecord) {
                // Update existing shift
                await updateAttendance.mutateAsync({
                    id: shiftRecord.id,
                    data: {
                        project_id: activeProjectId,
                        status: shiftStatus,
                    }
                });
                enqueueSnackbar('Shift updated!', { variant: 'success' });
            } else {
                // Assign new shift
                await addAttendance.mutateAsync({
                    project_id: activeProjectId,
                    user_id: String(targetUser!.id),
                    user_name: targetUser!.name,
                    date: format(shiftDialog.date, 'yyyy-MM-dd'),
                    status: shiftStatus,
                });
                enqueueSnackbar('Shift assigned!', { variant: 'success' });
            }
            setShiftDialog({ open: false, date: null });
            setShiftRecord(null);
        } catch (err: any) {
            const msg = err?.response?.status === 422 ? 'Validation error — check all fields.' : 'Failed to save shift';
            enqueueSnackbar(msg, { variant: 'error' });
        }
    };

    const handleDeleteRecord = async (r: AttendanceRecord) => {
        if (!activeProjectId) return;
        try {
            await deleteAttendance.mutateAsync({ id: r.id, projectId: activeProjectId });
            enqueueSnackbar('Record removed', { variant: 'info' });
        } catch {
            enqueueSnackbar('Failed to delete', { variant: 'error' });
        }
    };

    // ── Stats (My schedule) ────────────────────────────────────────────────────
    const myStats = useMemo(() => {
        const all = records.filter(r => String(r.user_id) === myUserId);
        const tally: Record<string, number> = {};
        SHIFTS.forEach(s => { tally[s] = 0; });
        all.forEach(r => { tally[r.status] = (tally[r.status] ?? 0) + 1; });
        return { total: all.length, tally };
    }, [records, myUserId]);

    // ── Render calendar cell ───────────────────────────────────────────────────
    const renderCell = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayRecords = activeRecords[dateStr] ?? [];
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const inMonth = isSameMonth(day, currentMonth);
        const today = isToday(day);

        // Personal remark for MY tab - Look for Note status or future field
        const myPersonalRec = myRecordsByDate[dateStr]?.find(r => (r.status === 'Note' && r.remarks) || r.personal_remark);
        const myPersonalRemark = myPersonalRec?.remarks || myPersonalRec?.personal_remark;

        return (
            <div
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={`
                    relative min-h-[110px] border-r border-b border-slate-100 dark:border-slate-800/60
                    p-2 cursor-pointer transition-all group
                    ${!inMonth ? 'opacity-25 pointer-events-none' : ''}
                    ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-900/20 ring-2 ring-inset ring-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                `}
            >
                {/* Date number */}
                <div className="flex items-start justify-between mb-1.5">
                    <span className={`
                        w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center
                        ${today
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'}
                    `}>
                        {format(day, 'd')}
                    </span>

                    {/* Personal remark icon */}
                    {tab === 0 && myPersonalRemark && (
                        <Tooltip title={myPersonalRemark} placement="top">
                            <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
                                <FuseSvgIcon size={11} className="text-amber-600">heroicons-solid:heart</FuseSvgIcon>
                            </span>
                        </Tooltip>
                    )}
                    {tab === 1 && dayRecords.length > 0 && (
                        <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full">
                            {dayRecords.length}
                        </span>
                    )}
                </div>

                {/* Shift pills */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayRecords.slice(0, tab === 0 ? 2 : 3).map((r, i) => {
                        const name = tab === 0 ? null : (r.user?.name || r.user_name || 'Staff');
                        const c = getShiftStyle(r.status);
                        return (
                            <div
                                key={i}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold truncate"
                                style={{ backgroundColor: c.bg, color: c.text }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
                                <span className="truncate">{name ? `${name}` : r.status}</span>
                            </div>
                        );
                    })}
                    {dayRecords.length > (tab === 0 ? 2 : 3) && (
                        <span className="text-[8px] text-slate-400 font-black ml-1">+{dayRecords.length - (tab === 0 ? 2 : 3)} more</span>
                    )}
                </div>

                {/* Quick-action overlay on hover (My schedule only) */}
                {tab === 0 && inMonth && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-none">
                        <Tooltip title="Add personal remark">
                            <IconButton
                                size="small"
                                onClick={e => { e.stopPropagation(); openRemarkDialog(day); }}
                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm"
                                sx={{ width: 30, height: 30 }}
                            >
                                <FuseSvgIcon size={14}>heroicons-outline:heart</FuseSvgIcon>
                            </IconButton>
                        </Tooltip>
                        {isSupervisor && (
                            <Tooltip title="Assign shift">
                                <IconButton
                                    size="small"
                                    onClick={e => { e.stopPropagation(); setSelectedDate(day); openShiftDialog(day); }}
                                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm"
                                    sx={{ width: 30, height: 30 }}
                                >
                                    <FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                )}

                {/* Supervisor quick-add on Team tab */}
                {tab === 1 && inMonth && isSupervisor && (
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton
                            size="small"
                            onClick={e => { e.stopPropagation(); setSelectedDate(day); openShiftDialog(day); }}
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            sx={{ width: 22, height: 22 }}
                        >
                            <FuseSvgIcon size={12}>heroicons-outline:plus</FuseSvgIcon>
                        </IconButton>
                    </div>
                )}
            </div>
        );
    };

    // ── Side panel records for selected date ───────────────────────────────────
    const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const selectedRecords = selectedDate ? (activeRecords[selectedDateStr] ?? []) : [];
    const mySelectedRec = selectedDate ? myRecordsByDate[selectedDateStr]?.find(r => (r.status === 'Note' && r.remarks) || r.personal_remark) : null;
    const mySelectedRemark = mySelectedRec?.remarks || mySelectedRec?.personal_remark;

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950">
                <CircularProgress sx={{ color: '#6366f1' }} size={48} />
            </div>
        );
    }

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto p-6 lg:p-10">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-5">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <FuseSvgIcon size={24} className="text-white">heroicons-outline:calendar-days</FuseSvgIcon>
                            </div>
                            Attendance
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 ml-14">
                            {isSupervisor ? 'Manage team shifts and assign schedules (Supervisor)' : 'View your schedule and add personal remarks'}
                        </p>
                    </div>

                    {/* Month nav */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm">
                        <IconButton size="small" onClick={goPrev} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                            <FuseSvgIcon size={18}>heroicons-outline:chevron-left</FuseSvgIcon>
                        </IconButton>
                        <Typography className="text-sm font-black text-slate-900 dark:text-white min-w-[150px] text-center uppercase tracking-widest">
                            {format(currentMonth, 'MMMM yyyy')}
                        </Typography>
                        <IconButton size="small" onClick={goNext} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                            <FuseSvgIcon size={18}>heroicons-outline:chevron-right</FuseSvgIcon>
                        </IconButton>
                        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                        <Button size="small" onClick={goToday} className="rounded-xl text-[11px] font-black uppercase tracking-wider px-3 hover:bg-indigo-50 text-indigo-600">
                            Today
                        </Button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
                        {['My Schedule', 'Team Schedule'].map((label, i) => (
                            <button
                                key={label}
                                onClick={() => { setTab(i as 0 | 1); setSelectedDate(null); }}
                                className={`
                                    px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                                    ${tab === i
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}
                                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* My month summary chips */}
                    {tab === 0 && (
                        <div className="flex flex-wrap gap-1.5 overflow-hidden">
                            {Object.entries(myStats.tally)
                                .filter(([, v]) => v > 0)
                                .map(([s, v]) => {
                                    const c = getShiftStyle(s);
                                    return (
                                        <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border"
                                            style={{ backgroundColor: c.bg, color: c.text, borderColor: c.dot + '40' }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                                            {s} · {v}
                                        </span>
                                    );
                                })}
                        </div>
                    )}

                    {/* Supervisor action hint */}
                    {isSupervisor && tab === 0 && (
                        <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
                            <FuseSvgIcon size={14} className="text-indigo-500">heroicons-outline:cursor-arrow-rays</FuseSvgIcon>
                            Hover a day to assign shifts
                        </div>
                    )}
                </div>

                {/* ── Legend ── */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {['Morning', 'Night', 'Rest day', 'Off day', 'Annual leave', 'MC', 'PH (public holiday)', 'OST'].map(s => {
                        const c = getShiftStyle(s);
                        return (
                            <span key={s} className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1 px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: c.bg, color: c.text }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                                {s}
                            </span>
                        );
                    })}
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <FuseSvgIcon size={10}>heroicons-solid:heart</FuseSvgIcon>
                        Personal remark
                    </span>
                </div>

                {/* ── Main grid ── */}
                <div className={`flex gap-6 transition-all ${selectedDate ? '' : ''}`}>

                    {/* Calendar */}
                    <div className="flex-1 min-w-0">
                        <Paper className="overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900/80">
                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="py-3 text-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Cells */}
                            <div className="grid grid-cols-7">
                                {calendarDays.map(day => renderCell(day))}
                            </div>
                        </Paper>
                    </div>

                    {/* ── Side panel ── */}
                    <AnimatePresence>
                        {selectedDate && (
                            <motion.div
                                initial={{ opacity: 0, x: 30, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: 320 }}
                                exit={{ opacity: 0, x: 30, width: 0 }}
                                className="flex-shrink-0 overflow-hidden"
                                style={{ width: 320 }}
                            >
                                <Paper className="rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900/80 overflow-hidden h-full">
                                    {/* Panel header */}
                                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">
                                                    {format(selectedDate, 'EEEE')}
                                                </p>
                                                <h2 className="text-4xl font-black leading-none">
                                                    {format(selectedDate, 'd')}
                                                </h2>
                                                <p className="text-indigo-200 font-bold text-sm mt-1">
                                                    {format(selectedDate, 'MMMM yyyy')}
                                                </p>
                                            </div>
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedDate(null)}
                                                className="text-white hover:bg-white/20"
                                            >
                                                <FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
                                            </IconButton>
                                        </div>

                                        {/* Quick actions in panel header */}
                                        <div className="flex gap-2 mt-4">
                                            {tab === 0 && (
                                                <button
                                                    onClick={() => openRemarkDialog(selectedDate)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    <FuseSvgIcon size={13}>heroicons-outline:heart</FuseSvgIcon>
                                                    Add Remark
                                                </button>
                                            )}
                                            {isSupervisor && (
                                                <button
                                                    onClick={() => openShiftDialog(selectedDate)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    <FuseSvgIcon size={13}>heroicons-outline:plus-circle</FuseSvgIcon>
                                                    Assign Shift
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 200px)' }}>

                                        {/* Personal remark block */}
                                        {tab === 0 && mySelectedRemark && (
                                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                                                <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <FuseSvgIcon size={15} className="text-amber-600">heroicons-solid:heart</FuseSvgIcon>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-0.5">My Note</p>
                                                    <p className="text-sm font-semibold text-amber-900 leading-snug italic">"{mySelectedRemark}"</p>
                                                    <button
                                                        onClick={() => openRemarkDialog(selectedDate!)}
                                                        className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Shifts list */}
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                {tab === 0 ? 'Your Shift' : `Shifts (${selectedRecords.length})`}
                                            </p>

                                            {selectedRecords.length === 0 ? (
                                                <div className="py-8 flex flex-col items-center text-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                        <FuseSvgIcon size={24} className="text-slate-300">heroicons-outline:calendar-x-mark</FuseSvgIcon>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">No shifts recorded</p>
                                                    {isSupervisor && (
                                                        <button
                                                            onClick={() => openShiftDialog(selectedDate!)}
                                                            className="mt-3 text-[10px] font-black text-indigo-500 uppercase tracking-wider hover:underline"
                                                        >
                                                            + Assign one now
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedRecords.map(r => {
                                                        const name = r.user?.name || r.user_name || 'Staff';
                                                        const c = getShiftStyle(r.status);
                                                        const isMyRecord = String(r.user_id) === myUserId;
                                                        return (
                                                            <div
                                                                key={r.id}
                                                                className="group flex items-center justify-between p-3 rounded-2xl border transition-all hover:shadow-sm"
                                                                style={{ backgroundColor: c.bg + '60', borderColor: c.dot + '30' }}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div
                                                                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                                                                        style={{ backgroundColor: c.bg, color: c.text }}
                                                                    >
                                                                        {name[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                                            {name} {isMyRecord && <span className="text-indigo-500">(You)</span>}
                                                                        </p>
                                                                        <ShiftBadge status={r.status} size="xs" />
                                                                        {(r.personal_remark || (r.status === 'Note' && r.remarks)) && (
                                                                            <p className="text-[9px] italic text-amber-700 mt-0.5 truncate">
                                                                                ❤ {r.personal_remark || r.remarks}
                                                                            </p>
                                                                        )}
                                                                        {r.assigned_by_name && (
                                                                            <p className="text-[8px] text-slate-400 mt-0.5">
                                                                                By {r.assigned_by_name}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                                    {isSupervisor && (
                                                                        <Tooltip title="Edit shift">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => openShiftDialog(selectedDate!, r)}
                                                                                className="text-indigo-500 hover:bg-indigo-50"
                                                                                sx={{ width: 26, height: 26 }}
                                                                            >
                                                                                <FuseSvgIcon size={13}>heroicons-outline:pencil-square</FuseSvgIcon>
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                    {(isSupervisor || isMyRecord) && (
                                                                        <Tooltip title="Delete">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleDeleteRecord(r)}
                                                                                className="text-rose-500 hover:bg-rose-50"
                                                                                sx={{ width: 26, height: 26 }}
                                                                            >
                                                                                <FuseSvgIcon size={13}>heroicons-outline:trash</FuseSvgIcon>
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Paper>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ═══ DIALOG: Personal Remark ═══════════════════════════════════════ */}
            <Dialog
                open={remarkDialog.open}
                onClose={() => setRemarkDialog({ open: false, date: null })}
                PaperProps={{ sx: { borderRadius: '28px', p: 1, maxWidth: 440, width: '100%', backgroundImage: 'none', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' } }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                            <FuseSvgIcon size={20} className="text-amber-600">heroicons-solid:heart</FuseSvgIcon>
                        </div>
                        <div>
                            <Typography className="text-lg font-black dark:text-white">Personal Remark</Typography>
                            {remarkDialog.date && (
                                <Typography className="text-xs text-slate-400 font-bold">{format(remarkDialog.date, 'EEEE, do MMMM yyyy')}</Typography>
                            )}
                        </div>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Add a personal note about this day — <span className="text-amber-700 font-bold">only you can see this</span>. It could be a birthday, special occasion, or any personal reminder.
                    </p>
                    <TextField
                        autoFocus
                        multiline
                        rows={3}
                        placeholder="e.g. It's my daughter's birthday 🎂"
                        fullWidth
                        value={remarkText}
                        onChange={e => setRemarkText(e.target.value)}
                        inputProps={{ maxLength: 200 }}
                        helperText={`${remarkText.length}/200`}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                    />
                </DialogContent>
                <DialogActions className="p-5 gap-2">
                    <Button
                        onClick={() => setRemarkDialog({ open: false, date: null })}
                        className="rounded-xl font-black uppercase tracking-widest px-5"
                    >
                        Cancel
                    </Button>
                    {remarkDialog.existing?.personal_remark && (
                        <Button
                            onClick={() => { setRemarkText(''); handleSaveRemark(); }}
                            className="rounded-xl font-black uppercase tracking-widest px-5 text-rose-500"
                        >
                            Clear
                        </Button>
                    )}
                    <Button
                        onClick={handleSaveRemark}
                        variant="contained"
                        disabled={upsertRemark.isPending}
                        sx={{ borderRadius: '14px', fontWeight: 900, px: 4, bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}
                    >
                        {upsertRemark.isPending ? <CircularProgress size={18} color="inherit" /> : 'Save Note'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ DIALOG: Assign / Edit Shift (Supervisor) ══════════════════════ */}
            <Dialog
                open={shiftDialog.open}
                onClose={() => { setShiftDialog({ open: false, date: null }); setShiftRecord(null); }}
                PaperProps={{ sx: { borderRadius: '28px', p: 1, maxWidth: 440, width: '100%', backgroundImage: 'none', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' } }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
                            <FuseSvgIcon size={20} className="text-indigo-600">heroicons-outline:user-plus</FuseSvgIcon>
                        </div>
                        <div>
                            <Typography className="text-lg font-black dark:text-white">
                                {shiftRecord ? 'Edit Shift' : 'Assign Shift'}
                            </Typography>
                            {shiftDialog.date && (
                                <Typography className="text-xs text-slate-400 font-bold">{format(shiftDialog.date, 'EEEE, do MMMM yyyy')}</Typography>
                            )}
                        </div>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-5 pt-2">
                        {!shiftRecord && (
                            <FormControl fullWidth>
                                <InputLabel>Select Facilitator / Personnel</InputLabel>
                                <Select
                                    value={shiftUserId}
                                    onChange={e => setShiftUserId(e.target.value)}
                                    label="Select Facilitator / Personnel"
                                    sx={{ borderRadius: '16px', fontWeight: 700 }}
                                >
                                    {users.map(u => (
                                        <MenuItem key={u.id} value={String(u.id)} className="font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                                                    {u.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm">{u.name}</p>
                                                    {u.role && <p className="text-[10px] text-slate-400 uppercase font-bold">{u.role}</p>}
                                                </div>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {shiftRecord && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                                    {(shiftRecord.user?.name || shiftRecord.user_name || 'S')[0]}
                                </div>
                                <div>
                                    <p className="font-black text-sm">{shiftRecord.user?.name || shiftRecord.user_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Editing existing shift</p>
                                </div>
                            </div>
                        )}

                        <FormControl fullWidth>
                            <InputLabel>Shift / Status</InputLabel>
                            <Select
                                value={shiftStatus}
                                onChange={e => setShiftStatus(e.target.value)}
                                label="Shift / Status"
                                sx={{ borderRadius: '16px', fontWeight: 700 }}
                            >
                                {SHIFTS.filter(s => s !== 'Note').map(s => {
                                    const c = getShiftStyle(s);
                                    return (
                                        <MenuItem key={s} value={s}>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.dot }} />
                                                <span className="font-bold text-sm">{s}</span>
                                            </div>
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        {/* Preview */}
                        <div className="flex items-center gap-2 p-3 rounded-2xl border" style={{ backgroundColor: getShiftStyle(shiftStatus).bg + '50', borderColor: getShiftStyle(shiftStatus).dot + '40' }}>
                            <FuseSvgIcon size={16} className="text-slate-400">heroicons-outline:eye</FuseSvgIcon>
                            <p className="text-xs font-bold text-slate-600">Preview: </p>
                            <ShiftBadge status={shiftStatus} />
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className="p-5 gap-2">
                    <Button
                        onClick={() => { setShiftDialog({ open: false, date: null }); setShiftRecord(null); }}
                        className="rounded-xl font-black uppercase tracking-widest px-5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveShift}
                        variant="contained"
                        disabled={(!shiftRecord && !shiftUserId) || addAttendance.isPending || updateAttendance.isPending}
                        sx={{ borderRadius: '14px', fontWeight: 900, px: 5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        {(addAttendance.isPending || updateAttendance.isPending)
                            ? <CircularProgress size={18} color="inherit" />
                            : shiftRecord ? 'Update Shift' : 'Assign Shift'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AttendancePage;

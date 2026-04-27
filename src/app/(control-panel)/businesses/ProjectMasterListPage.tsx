import { useState, useMemo, useEffect } from 'react';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SourceIcon from '@mui/icons-material/Source';
import { useNavigate } from 'react-router';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';

// ── Types ─────────────────────────────────────────────────────────
export type ProjectMasterListItem = {
    id: string;
    date: string;
    projectCode: string;
    projectTitle: string;
    poClient: string;
    bgDocument: string;
    bgIssueDate: string;
    prPoProcurement: string;
    deliveryOrder: string;
    invoiceDocument: string;
    projectProgressLink: string;
    projectFolderLink: string;
    sourcingLink: string;
    quotationLink: string;
};

// ── Link Helper ───────────────────────────────────────────────────
const formatLink = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) return trimmed;
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
    // If it looks like a domain, add https
    if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`;
    return trimmed;
};

const RenderValue = ({ value, icon }: { value: string, icon?: any }) => {
    if (!value) return <Typography variant="caption" color="text.disabled">—</Typography>;
    const isLink = value.includes('://') || value.startsWith('/') || value.includes('.com') || value.includes('.net') || value.includes('.my');
    
    if (isLink) {
        return (
            <Tooltip title={value}>
                <Box component="a" href={formatLink(value)} target="_blank" 
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: 12, '&:hover': { textDecoration: 'underline', color: '#2563eb' } }}>
                    {icon}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{value}</span>
                </Box>
            </Tooltip>
        );
    }
    return <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>;
};

// ── Column definitions ────────────────────────────────────────────
const COLUMNS = [
    { id: 'poClient',            label: 'PO/ LPO/ WO from Client', width: 220, icon: <ReceiptIcon sx={{ fontSize: 16 }} /> },
    { id: 'bgDocument',          label: 'BG Document',             width: 140, icon: <AttachFileIcon sx={{ fontSize: 16 }} /> },
    { id: 'bgIssueDate',         label: 'BG Issues Date',          width: 140, icon: <CalendarMonthIcon sx={{ fontSize: 16 }} /> },
    { id: 'prPoProcurement',     label: 'PR/PO to Procurement',    width: 220, icon: <LocalShippingIcon sx={{ fontSize: 16 }} /> },
    { id: 'deliveryOrder',       label: 'Delivery Order (DO)',     width: 160, icon: <LocalShippingIcon sx={{ fontSize: 16 }} /> },
    { id: 'invoiceDocument',     label: 'Invoice Document',        width: 160, icon: <ReceiptIcon sx={{ fontSize: 16 }} /> },
    { id: 'projectProgressLink', label: 'Project Progress',        width: 140, isLink: true },
    { id: 'projectFolderLink',   label: 'Project Folder Link',     width: 180, isLink: true },
    { id: 'sourcingLink',        label: 'Sourcing Link',           width: 140, isLink: true },
    { id: 'quotationLink',       label: 'Quotation Link',          width: 140, isLink: true },
];

const STATIC_COLUMNS = [
    { id: 'date',              label: 'Date',               width: 100 },
    { id: 'projectCode',       label: 'Project Code / No',  width: 160 },
    { id: 'projectTitle',      label: 'Project Title',      width: 250 },
];

// ── Styled Components ──────────────────────────────────────────────
function HeaderCell({ col, sortKey, sortDir, onSort }: {
    col: any; sortKey: string; sortDir: 'asc' | 'desc'; onSort: (id: string) => void;
}) {
    const active = sortKey === col.id;
    return (
        <th onClick={() => onSort(col.id)} style={{
            minWidth: col.width, width: col.width,
            background: '#f59e0b',
            color: '#fff', fontWeight: 800, fontSize: 10,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            padding: '0 12px', height: 52, whiteSpace: 'nowrap',
            position: 'sticky', top: 0, zIndex: 3,
            borderRight: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', userSelect: 'none',
            textAlign: 'left',
            transition: 'background 0.2s',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {col.icon}
                {col.isLink && <LinkIcon sx={{ fontSize: 16 }} />}
                <span>{col.label}</span>
                <SwapVertIcon sx={{
                    fontSize: 16, opacity: active ? 1 : 0.3,
                    transform: active && sortDir === 'desc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    ml: 'auto'
                }} />
            </Box>
        </th>
    );
}

const StyledTextField = ({ ...props }: any) => (
    <TextField
        fullWidth
        size="small"
        {...props}
        sx={{
            '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: alpha('#f59e0b', 0.02) },
                '&.Mui-focused': {
                    bgcolor: 'background.paper',
                    boxShadow: `0 0 0 4px ${alpha('#f59e0b', 0.1)}`,
                },
                '& fieldset': { borderColor: alpha('#000', 0.1) },
            },
            '& .MuiInputLabel-root': { fontSize: 13, fontWeight: 600, color: 'text.secondary' },
            ...props.sx
        }}
    />
);

function SectionTitle({ title, icon }: { title: string, icon?: any }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
            {icon}
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                {title}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 1 }} />
        </Box>
    );
}

// ── Project Dialog ─────────────────────────────────────────────────
function ProjectDialog({ open, initial, saving, onClose, onSave }: {
    open: boolean;
    initial: ProjectMasterListItem | null;
    saving: boolean;
    onClose: () => void;
    onSave: (t: Partial<ProjectMasterListItem>) => void;
}) {
    const [form, setForm] = useState<Partial<ProjectMasterListItem>>(initial || {});
    const set = (field: keyof ProjectMasterListItem) => (val: string) => setForm(p => ({ ...p, [field]: val }));
    const isEdit = !!initial;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body"
            PaperProps={{ sx: { borderRadius: 5, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}>

            <Box sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                px: 4, py: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden'
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                    <BusinessCenterIcon sx={{ fontSize: 120, color: '#fff' }} />
                </Box>
                <Box sx={{ zIndex: 1 }}>
                    <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: '-0.5px', mb: 0.5 }}>
                        {isEdit ? 'Update Project Tracking' : 'New Project Tracking'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                        {initial?.projectTitle || 'Loading project details...'} • {initial?.projectCode}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"
                    sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, zIndex: 1 }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 4, py: 4 }}>
                <SectionTitle title="Client & Procurement Documents" icon={<ReceiptIcon sx={{ fontSize: 16, color: '#f59e0b' }} />} />
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="PO/ LPO/ WO from Client" value={form.poClient || ''}
                            onChange={(e:any) => set('poClient')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="PR/PO to Procurement" value={form.prPoProcurement || ''}
                            onChange={(e:any) => set('prPoProcurement')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><LocalShippingIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="Delivery Order (DO)" value={form.deliveryOrder || ''}
                            onChange={(e:any) => set('deliveryOrder')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><LocalShippingIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="Invoice Document" value={form.invoiceDocument || ''}
                            onChange={(e:any) => set('invoiceDocument')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                </Grid>

                <SectionTitle title="Banking & Guarantees" icon={<BusinessCenterIcon sx={{ fontSize: 16, color: '#f59e0b' }} />} />
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="BG Document Path/Link" value={form.bgDocument || ''}
                            onChange={(e:any) => set('bgDocument')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><AttachFileIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="BG Issues Date" type="date" value={form.bgIssueDate || ''}
                            onChange={(e:any) => set('bgIssueDate')(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                </Grid>

                <SectionTitle title="Project Links & Resources" icon={<LinkIcon sx={{ fontSize: 16, color: '#f59e0b' }} />} />
                <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="Project Progress Link" value={form.projectProgressLink || ''}
                            onChange={(e:any) => set('projectProgressLink')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="Project Folder Link" value={form.projectFolderLink || ''}
                            onChange={(e:any) => set('projectFolderLink')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><FolderIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="Sourcing Link" value={form.sourcingLink || ''}
                            onChange={(e:any) => set('sourcingLink')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SourceIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <StyledTextField label="Quotation Link" value={form.quotationLink || ''}
                            onChange={(e:any) => set('quotationLink')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptIcon sx={{ fontSize: 18, color: '#f59e0b' }} /></InputAdornment> }} />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 4, pb: 4, pt: 0, gap: 1.5 }}>
                <Button onClick={onClose} disabled={saving}
                    sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700, color: 'text.secondary', px: 3 }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={() => onSave(form)}
                    disabled={saving}
                    sx={{
                        fontWeight: 800, textTransform: 'none', borderRadius: 2.5, boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)', px: 4, py: 1.2,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 12px 20px -4px rgba(245, 158, 11, 0.5)' }
                    }}>
                    {saving ? 'Updating...' : 'Save Tracking Data'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Main Page Component ──────────────────────────────────────────
export default function ProjectMasterListPage() {
    const navigate = useNavigate();
    const [tenders, setTenders]     = useState<ProjectMasterListItem[]>([]);
    const [loadingData, setLoading] = useState(true);
    const [search, setSearch]       = useState('');
    const [sortKey, setSortKey]     = useState('date');
    const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem]     = useState<ProjectMasterListItem | null>(null);
    const [saving, setSaving]         = useState(false);
    const [snack, setSnack]           = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

    useEffect(() => {
        api.get('tenders')
            .json<any[]>()
            .then(data => setTenders(data.map(fromApi)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSort = (id: string) => {
        if (sortKey === id) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(id); setSortDir('asc'); }
    };

    const handleSave = async (form: Partial<ProjectMasterListItem>) => {
        if (!editItem) return;
        setSaving(true);
        try {
            const updated = await api.put(`tenders/${editItem.id}`, { json: toApi(form) }).json<any>();
            setTenders(p => p.map(t => t.id === editItem.id ? fromApi(updated) : t));
            setDialogOpen(false);
            setEditItem(null);
            setSnack({ msg: 'Project tracking updated successfully.', sev: 'success' });
        } catch (err) {
            console.error('Failed to save', err);
            setSnack({ msg: 'Failed to save. Please try again.', sev: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (t: ProjectMasterListItem) => { setEditItem(t); setDialogOpen(true); };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return tenders
            .filter(t => !q || Object.values(t).some(v => String(v).toLowerCase().includes(q)))
            .sort((a, b) => {
                const av = (a as any)[sortKey] ?? '';
                const bv = (b as any)[sortKey] ?? '';
                if (sortKey === 'date') return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
                return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
            });
    }, [tenders, search, sortKey, sortDir]);

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            bgcolor: 'background.default',
        }}>
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Box sx={{ px: 4, py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                           borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2, bgcolor: 'background.paper' }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} letterSpacing="-1px">Project Master List</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                            Real-time execution tracking for awarded project documents and milestones
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField size="small" placeholder="Search projects…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                sx: { borderRadius: 3, bgcolor: alpha('#000', 0.02), '& fieldset': { borderColor: 'divider' } }
                            }}
                            sx={{ width: 280 }} />
                        <Tooltip title="Export tracking data to CSV">
                            <Button variant="outlined" startIcon={<DownloadIcon />} size="medium"
                                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                                Export
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>
            </motion.div>

            {/* Table Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 0, bgcolor: 'background.default' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', tableLayout: 'fixed', minWidth: 1800 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 50, background: '#f59e0b', color: '#fff', fontWeight: 900, fontSize: 10, height: 52, position: 'sticky', top: 0, left: 0, zIndex: 4, borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>#</th>
                                {STATIC_COLUMNS.map(col => (
                                    <HeaderCell key={col.id} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                ))}
                                {COLUMNS.map(col => (
                                    <HeaderCell key={col.id} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                ))}
                                <th style={{ width: 80, background: '#f59e0b', position: 'sticky', top: 0, right: 0, zIndex: 4, borderLeft: '1px solid rgba(255,255,255,0.2)' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filtered.map((row, idx) => (
                                    <motion.tr key={row.id} layout
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{ background: idx % 2 === 0 ? 'transparent' : alpha('#f59e0b', 0.02) }}>
                                        <td style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94a3b8', position: 'sticky', left: 0, bgcolor: idx % 2 === 0 ? '#fff' : '#fefcf8', zIndex: 2, borderRight: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{idx + 1}</td>
                                        <td style={{ padding: '0 12px', fontSize: 13, borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: 500 }}>{row.date}</td>
                                        <td style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, borderBottom: '1px solid rgba(0,0,0,0.05)', color: '#1e293b' }}>{row.projectCode}</td>
                                        <td style={{ padding: '0 12px', fontSize: 13, borderBottom: '1px solid rgba(0,0,0,0.05)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary', maxWidth: 250 }}>
                                            <Tooltip title={row.projectTitle} arrow placement="top">
                                                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>{row.projectTitle}</span>
                                            </Tooltip>
                                        </td>
                                        
                                        <td style={{ padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <RenderValue value={row.poClient} icon={<ReceiptIcon sx={{ fontSize: 14 }} />} />
                                        </td>
                                        <td style={{ padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            {row.bgDocument ? (
                                                <Tooltip title={row.bgDocument}>
                                                    <Chip icon={<AttachFileIcon sx={{ fontSize: 14 }} />} label="View Doc" size="small" component="a" href={formatLink(row.bgDocument)} target="_blank" clickable
                                                        sx={{ fontSize: 10, height: 24, fontWeight: 700, bgcolor: alpha('#f59e0b', 0.1), color: '#b45309', border: '1px solid', borderColor: alpha('#f59e0b', 0.2) }} />
                                                </Tooltip>
                                            ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                        </td>
                                        <td style={{ padding: '0 12px', fontSize: 13, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{row.bgIssueDate || <Typography variant="caption" color="text.disabled">—</Typography>}</td>
                                        <td style={{ padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <RenderValue value={row.prPoProcurement} icon={<LocalShippingIcon sx={{ fontSize: 14 }} />} />
                                        </td>
                                        <td style={{ padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            {row.deliveryOrder ? (
                                                <Tooltip title={row.deliveryOrder}>
                                                    <Chip icon={<LocalShippingIcon sx={{ fontSize: 14 }} />} label="View DO" size="small" component="a" href={formatLink(row.deliveryOrder)} target="_blank" clickable
                                                        sx={{ fontSize: 10, height: 24, fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#047857', border: '1px solid', borderColor: alpha('#10b981', 0.2) }} />
                                                </Tooltip>
                                            ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                        </td>
                                        <td style={{ padding: '0 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            {row.invoiceDocument ? (
                                                <Tooltip title={row.invoiceDocument}>
                                                    <Chip icon={<ReceiptIcon sx={{ fontSize: 14 }} />} label="View Inv" size="small" component="a" href={formatLink(row.invoiceDocument)} target="_blank" clickable
                                                        sx={{ fontSize: 10, height: 24, fontWeight: 700, bgcolor: alpha('#3b82f6', 0.1), color: '#1d4ed8', border: '1px solid', borderColor: alpha('#3b82f6', 0.2) }} />
                                                </Tooltip>
                                            ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                        </td>
                                        
                                        {[row.projectProgressLink, row.projectFolderLink, row.sourcingLink, row.quotationLink].map((link, lidx) => (
                                            <td key={lidx} style={{ padding: '0 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                {link ? (
                                                    <Tooltip title={link}>
                                                        <IconButton size="small" component="a" href={formatLink(link)} target="_blank"
                                                            sx={{ color: '#f59e0b', bgcolor: alpha('#f59e0b', 0.05), '&:hover': { bgcolor: alpha('#f59e0b', 0.15) } }}>
                                                            <LinkIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                            </td>
                                        ))}

                                        <td style={{ textAlign: 'center', position: 'sticky', right: 0, bgcolor: idx % 2 === 0 ? '#fff' : '#fefcf8', zIndex: 2, borderLeft: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <Tooltip title="Update Tracking Details">
                                                <IconButton size="small" onClick={() => openEdit(row)}
                                                    sx={{ color: '#f59e0b', bgcolor: alpha('#f59e0b', 0.1), '&:hover': { bgcolor: '#f59e0b', color: '#fff' } }}>
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </motion.div>
                </Box>

            <ProjectDialog open={dialogOpen} initial={editItem} saving={saving}
                onClose={() => setDialogOpen(false)} onSave={handleSave} />

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack?.sev} variant="filled" sx={{ borderRadius: 3, fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// ── Helpers ───────────────────────────────────────────────────────
function fromApi(raw: any): ProjectMasterListItem {
    return {
        id:                String(raw.id),
        date:              raw.date              ?? '',
        projectCode:       raw.project_code      ?? '',
        projectTitle:      raw.project_title     ?? '',
        poClient:          raw.po_client         ?? '',
        bgDocument:        raw.bg_document       ?? '',
        bgIssueDate:       raw.bg_issue_date     ?? '',
        prPoProcurement:   raw.pr_po_procurement ?? '',
        deliveryOrder:     raw.delivery_order    ?? '',
        invoiceDocument:   raw.invoice_document  ?? '',
        projectProgressLink: raw.project_progress_link ?? '',
        projectFolderLink: raw.project_folder_link ?? '',
        sourcingLink:      raw.sourcing_link      ?? '',
        quotationLink:     raw.quotation_link     ?? '',
    };
}

function toApi(form: Partial<ProjectMasterListItem>) {
    return {
        po_client:              form.poClient              || null,
        bg_document:            form.bgDocument            || null,
        bg_issue_date:          form.bgIssueDate           || null,
        pr_po_procurement:      form.prPoProcurement       || null,
        delivery_order:         form.deliveryOrder         || null,
        invoice_document:       form.invoiceDocument       || null,
        project_progress_link:  form.projectProgressLink   || null,
        project_folder_link:    form.projectFolderLink     || null,
        sourcing_link:          form.sourcingLink          || null,
        quotation_link:         form.quotationLink         || null,
    };
}

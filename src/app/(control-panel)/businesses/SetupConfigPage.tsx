import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import SaveIcon from '@mui/icons-material/Save';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import api from '@/utils/api';

export default function SetupConfigPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [tab, setTab] = useState(0);

    // Dynamic document titles (project master list custom columns)
    const FIXED_COLUMNS_DEFAULTS = [
        { id: 'fixed-1', label: 'PO/ LPO/ WO from Client', color: 'po_client', text_color: 'pdf', isFixed: true },
        { id: 'fixed-2', label: 'PR/PO to Procurement', color: 'pr_po_procurement', text_color: 'pdf', isFixed: true },
        { id: 'fixed-3', label: 'Delivery Order (DO)', color: 'delivery_order', text_color: 'pdf', isFixed: true },
        { id: 'fixed-4', label: 'Invoice Document', color: 'invoice_document', text_color: 'pdf', isFixed: true },
        { id: 'fixed-5', label: 'Project Progress', color: 'project_progress_files', text_color: 'pdf', isFixed: true },
        { id: 'fixed-6', label: 'Project Folder', color: 'project_folder_files', text_color: 'pdf', isFixed: true },
        { id: 'fixed-7', label: 'Sourcing', color: 'sourcing_files', text_color: 'pdf', isFixed: true },
        { id: 'fixed-8', label: 'Quotation', color: 'quotation_files', text_color: 'pdf', isFixed: true },
    ];

    const [docTitles, setDocTitles] = useState<any[]>([]);
    
    const allDocColumns = useMemo(() => {
        const list = FIXED_COLUMNS_DEFAULTS.map(fixed => {
            const dbItem = docTitles.find(d => d.color === fixed.color);
            if (dbItem) {
                return { ...dbItem, isFixed: true };
            }
            return fixed;
        });
        
        const customList = docTitles.filter(d => !FIXED_COLUMNS_DEFAULTS.some(f => f.color === d.color));
        return [...list, ...customList];
    }, [docTitles]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [formLabel, setFormLabel] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formRestriction, setFormRestriction] = useState('pdf');

    // System configurations (costing settings)
    const [configs, setConfigs] = useState<Record<string, string>>({ sst_rate: '8' });
    const [loadingConfigs, setLoadingConfigs] = useState(true);
    const [savingConfigs, setSavingConfigs] = useState(false);
    const [configSuccess, setConfigSuccess] = useState(false);

    useEffect(() => {
        fetchDocTitles();
        fetchSystemConfigs();
    }, []);

    const fetchDocTitles = async () => {
        setLoadingDocs(true);
        try {
            const raw = await api.get('master-list').json<any>();
            // Raw index returns grouping of categories
            setDocTitles(raw.project_document_title || []);
        } catch (e) {
            console.error('Error fetching dynamic doc titles:', e);
        } finally {
            setLoadingDocs(false);
        }
    };

    const fetchSystemConfigs = async () => {
        setLoadingConfigs(true);
        try {
            const res = await api.get('system-configs').json<Record<string, string>>();
            if (res && res.sst_rate !== undefined) {
                setConfigs(res);
            }
        } catch (e) {
            console.error('Error fetching system configs:', e);
        } finally {
            setLoadingConfigs(false);
        }
    };

    const handleLabelChange = (val: string) => {
        setFormLabel(val);
        // Auto generate slug
        const slug = val
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        setFormSlug(slug);
    };

    const handleOpenAdd = () => {
        setEditItem(null);
        setFormLabel('');
        setFormSlug('');
        setFormRestriction('pdf');
        setDialogOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditItem(item);
        setFormLabel(item.label);
        setFormSlug(item.color || '');
        setFormRestriction(item.text_color || 'pdf');
        setDialogOpen(true);
    };

    const handleSaveDocTitle = async () => {
        if (!formLabel.trim() || !formSlug.trim()) return;

        try {
            if (editItem && typeof editItem.id === 'number') {
                // Update
                await api.put(`master-list/${editItem.id}`, {
                    json: {
                        label: formLabel.trim(),
                        color: formSlug.trim(),
                        text_color: formRestriction,
                    }
                }).json();
            } else {
                // Create (or Override a fixed default column)
                // Check if slug is duplicated for brand new custom columns only
                if (!editItem && docTitles.some(d => d.color === formSlug)) {
                    alert('A document title with this column slug already exists!');
                    return;
                }
                // Create
                await api.post('master-list', {
                    json: {
                        category: 'project_document_title',
                        label: formLabel.trim(),
                        color: formSlug.trim(),
                        text_color: formRestriction,
                    }
                }).json();
            }
            setDialogOpen(false);
            fetchDocTitles();
        } catch (e) {
            console.error('Error saving doc title:', e);
        }
    };

    const handleDeleteDocTitle = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document title? Any files uploaded under this column will remain on disk but will no longer be visible.')) return;
        try {
            await api.delete(`master-list/${id}`).json();
            fetchDocTitles();
        } catch (e) {
            console.error('Error deleting doc title:', e);
        }
    };

    const handleSaveConfigs = async () => {
        setSavingConfigs(true);
        setConfigSuccess(false);
        try {
            const res = await api.post('system-configs', {
                json: {
                    configs: {
                        sst_rate: configs.sst_rate
                    }
                }
            }).json<Record<string, string>>();
            setConfigs(res);
            setConfigSuccess(true);
            setTimeout(() => setConfigSuccess(false), 4000);
        } catch (e) {
            console.error('Error saving system configs:', e);
        } finally {
            setSavingConfigs(false);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Header section */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Setup Config</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                            Configure system parameters, dynamic file columns, and global costing settings.
                        </Typography>
                    </Box>
                </Box>
            </motion.div>

            {/* Navigation Tabs */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 48, fontSize: 13 },
                        '& .Mui-selected': { color: '#2563eb' },
                        '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3, borderRadius: 2 },
                    }}>
                    <Tab label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <DescriptionIcon fontSize="small" />
                            <span>Project Master List Columns</span>
                        </Box>
                    } />
                    <Tab label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <SettingsIcon fontSize="small" />
                            <span>Costing & SST Settings</span>
                        </Box>
                    } />
                </Tabs>
            </Box>

            {/* Scrollable Contents */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <AnimatePresence mode="wait">
                    {tab === 0 ? (
                        <motion.div key="tab-docs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
                                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={800}>Dynamic Document Tracking</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Define custom document upload titles to track in the <strong>Project Master List</strong> page.
                                        </Typography>
                                    </Box>
                                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenAdd}
                                        sx={{
                                            fontWeight: 700, textTransform: 'none', borderRadius: 2, boxShadow: 'none',
                                            background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                                            '&:hover': { background: 'linear-gradient(135deg, #1a3354, #1d4ed8)', boxShadow: 'none' }
                                        }}>
                                        Add Custom Column
                                    </Button>
                                </Box>

                                {loadingDocs ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                        <CircularProgress size={36} />
                                    </Box>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>Document Title</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>System Identifier (Slug)</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Column Type</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Allowed File Format</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {allDocColumns.map((item) => (
                                                    <TableRow key={item.id} hover>
                                                        <TableCell sx={{ fontWeight: 600 }}>{item.label}</TableCell>
                                                        <TableCell>
                                                            <Chip label={item.color} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontWeight: 600 }} />
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.isFixed ? (
                                                                <Chip label="Core Column" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: 10 }} />
                                                            ) : (
                                                                <Chip label="Custom Column" size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700, fontSize: 10 }} />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.text_color === 'pdf' ? (
                                                                <Chip label="PDF Only" size="small" color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: 10 }} />
                                                            ) : (
                                                                <Chip label="Any Format" size="small" color="info" variant="outlined" sx={{ fontWeight: 700, fontSize: 10 }} />
                                                            )}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'right' }}>
                                                            <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ mr: 1 }}>
                                                                <EditIcon fontSize="small" color="primary" />
                                                            </IconButton>
                                                            {!item.isFixed ? (
                                                                <IconButton size="small" onClick={() => handleDeleteDocTitle(item.id)}>
                                                                    <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                                                                </IconButton>
                                                            ) : (
                                                                <IconButton size="small" disabled sx={{ opacity: 0.3 }}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {allDocColumns.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                            No custom document columns defined yet. Click <strong>Add Custom Column</strong> to begin.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Paper>
                        </motion.div>
                    ) : (
                        <motion.div key="tab-configs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', maxWidth: 650 }} elevation={0}>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Global Costing Configuration</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Manage tax rates, formulas, and parameters for tender financials.
                                </Typography>

                                {configSuccess && (
                                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                                        Costing configurations updated successfully!
                                    </Alert>
                                )}

                                {loadingConfigs ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress size={32} />
                                    </Box>
                                ) : (
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                                                Sales & Service Tax (SST) Rate (%)
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                                                {['6', '8', '10'].map((rate) => (
                                                    <Chip
                                                        key={rate}
                                                        label={`${rate}%`}
                                                        onClick={() => setConfigs({ ...configs, sst_rate: rate })}
                                                        color={configs.sst_rate === rate ? 'primary' : 'default'}
                                                        variant={configs.sst_rate === rate ? 'filled' : 'outlined'}
                                                        sx={{ fontWeight: 700, px: 1, cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                label="Custom SST Rate (%)"
                                                value={configs.sst_rate}
                                                onChange={(e) => setConfigs({ ...configs, sst_rate: e.target.value })}
                                                InputProps={{
                                                    endAdornment: <Typography variant="body2" color="text.secondary" fontWeight={700}>%</Typography>
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                                                This value controls the active SST rate applied globally across item checklists, summary blocks, and financial breakdown sheets.
                                            </Typography>
                                        </Grid>

                                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSaveConfigs}
                                                disabled={savingConfigs || !configs.sst_rate}
                                                sx={{
                                                    fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3, boxShadow: 'none',
                                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                                    '&:hover': { background: '#059669', boxShadow: 'none' }
                                                }}
                                            >
                                                {savingConfigs ? 'Saving Settings...' : 'Save Costing Settings'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                )}
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Document Title Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {editItem ? 'Edit Custom Column' : 'Add Custom Column'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                size="small"
                                label="Document Title"
                                placeholder="e.g. FAT Checklist, Handover Document"
                                value={formLabel}
                                onChange={(e) => handleLabelChange(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Column Identifier (Slug)"
                                disabled
                                value={formSlug}
                                helperText="Automatically generated and used in database schema tracking."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Allowed File Format</InputLabel>
                                <Select
                                    label="Allowed File Format"
                                    value={formRestriction}
                                    onChange={(e) => setFormRestriction(e.target.value)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="pdf">PDF Format Only</MenuItem>
                                    <MenuItem value="any">Any File Format (Image, Documents, Excel, PDFs)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveDocTitle}
                        disabled={!formLabel.trim() || !formSlug.trim()}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
                    >
                        {editItem ? 'Save Changes' : 'Add Column'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

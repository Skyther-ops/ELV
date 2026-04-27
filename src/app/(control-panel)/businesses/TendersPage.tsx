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
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TagIcon from '@mui/icons-material/Tag';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { useMasterList, MasterListItem } from './context/MasterListContext';
import { useNavigate } from 'react-router';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';

// ── Types ─────────────────────────────────────────────────────────
export type Tender = {
    id: string;
    date: string;
    projectCode: string;
    status: string;
    type: string;
    company: string;
    customer: string;
    supplier: string;
    agencyTypes: string;
    projectTitle: string;
    personInCharge: string;
    contactNo: string;
    email: string;
    internalQuotation: string;
    salesPrice?: number;
    costPrice?: number;
    margin?: number;
    submissionDate?: string;
    successRate?: string;
    poClient?: string;
    bgDocument?: string;
    bgIssueDate?: string;
    prPoProcurement?: string;
    deliveryOrder?: string;
    invoiceDocument?: string;
    projectProgressLink?: string;
    projectFolderLink?: string;
    sourcingLink?: string;
    quotationLink?: string;
    creator?: { id: number, name: string };
    creatorName?: string;
};

// ── Column definitions ────────────────────────────────────────────
const COLUMNS = [
    { id: 'date',              label: 'Date',               width: 90  },
    { id: 'projectCode',       label: 'Project Code / No',  width: 140 },
    { id: 'status',            label: 'Status',             width: 125 },
    { id: 'type',              label: 'Type',               width: 110 },
    { id: 'company',           label: 'Company',            width: 100 },
    { id: 'customer',          label: 'Customer',           width: 140 },
    { id: 'supplier',          label: 'Supplier',           width: 180 },
    { id: 'agencyTypes',       label: 'Agency Types',       width: 150 },
    { id: 'projectTitle',      label: 'Project Title',      width: 140 },
    { id: 'personInCharge',    label: 'Person In Charge',   width: 140 },
    { id: 'contactNo',         label: 'Contact No.',        width: 110 },
    { id: 'email',             label: 'Email',              width: 140 },
    { id: 'internalQuotation', label: 'Int. Quotation',     width: 120  },
    { id: 'creatorName',       label: 'Created By',         width: 120 },
];

// ── Blue Header Cell ──────────────────────────────────────────────
function HeaderCell({ col, sortKey, sortDir, onSort }: {
    col: typeof COLUMNS[0]; sortKey: string; sortDir: 'asc' | 'desc'; onSort: (id: string) => void;
}) {
    const active = sortKey === col.id;
    return (
        <th onClick={() => onSort(col.id)} style={{
            minWidth: col.width, width: col.width,
            background: 'linear-gradient(180deg, #1e3a5f 0%, #1a3354 100%)',
            color: '#fff', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.03em', textTransform: 'uppercase',
            padding: '0 8px', height: 40, whiteSpace: 'nowrap',
            position: 'sticky', top: 0, zIndex: 3,
            borderRight: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', userSelect: 'none',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{col.label}</span>
                <SwapVertIcon fontSize="inherit" sx={{
                    fontSize: 14, opacity: active ? 1 : 0.35,
                    color: active ? '#60a5fa' : '#fff',
                    transform: active && sortDir === 'desc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                }} />
            </div>
        </th>
    );
}

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ color: '#2563eb', display: 'flex' }}>{icon}</Box>
            <Typography variant="caption" fontWeight={800}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', fontSize: 11 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#dbeafe', ml: 1 }} />
        </Box>
    );
}

// ── Free-solo history Autocomplete (for text fields) ─────────────
function FreeSoloInput({ label, value, onChange, history, type }: {
    label: string; value: string; onChange: (v: string) => void;
    history: string[]; type?: string;
}) {
    const opts = Array.from(new Set(history.filter(Boolean))).sort();
    return (
        <Autocomplete
            fullWidth
            freeSolo
            disablePortal
            size="small"
            options={opts}
            value={value}
            inputValue={value}
            onInputChange={(_, v) => onChange(v)}
            onChange={(_, v) => onChange(v ?? '')}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    type={type}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
            renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                    <Box component="li" key={key} {...rest}
                        sx={{ fontSize: 12, color: 'text.secondary', py: '4px !important' }}>
                        {option}
                    </Box>
                );
            }}
        />
    );
}

// ── Autocomplete Chip Select (for large lists: customer, agency) ──
function ChipAutocomplete({ label, value, onChange, items }: {
    label: string; value: string; onChange: (v: string) => void; items: MasterListItem[];
}) {
    const selected = items.find(i => i.label === value) ?? null;
    return (
        <Autocomplete
            fullWidth
            disablePortal
            size="small"
            options={items}
            value={selected}
            getOptionLabel={(option) => option.label}
            onChange={(_, newValue) => onChange(newValue?.label ?? '')}
            isOptionEqualToValue={(option, val) => option.label === val.label}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
            renderOption={(props, option) => {
                // Destructure key separately to avoid React key warning
                const { key, ...rest } = props as any;
                return (
                    <Box component="li" key={key} {...rest}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, py: '6px !important' }}>
                        <Chip
                            label={option.label}
                            size="small"
                            sx={{
                                bgcolor: option.color || 'transparent',
                                color: option.color ? (option.textColor || '#fff') : 'text.primary',
                                fontWeight: 700, fontSize: 11,
                                border: !option.color ? '1px solid #e5e7eb' : 'none',
                                pointerEvents: 'none',
                            }}
                        />
                    </Box>
                );
            }}
        />
    );
}

// ── Multi Autocomplete Chip Select (for multiple suppliers) ───────
function MultiChipAutocomplete({ label, value, onChange, items }: {
    label: string; value: string; onChange: (v: string) => void; items: MasterListItem[];
}) {
    const valueArray = useMemo(() => value ? value.split(',').map(v => v.trim()).filter(Boolean) : [], [value]);
    const selected = useMemo(() => items.filter(i => valueArray.includes(i.label)), [items, valueArray]);

    return (
        <Autocomplete
            multiple
            fullWidth
            disablePortal
            size="small"
            options={items}
            value={selected}
            getOptionLabel={(option) => option.label}
            onChange={(_, newValue) => {
                const labels = newValue.map(v => v.label).join(', ');
                onChange(labels);
            }}
            isOptionEqualToValue={(option, val) => option.label === val.label}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                        <Chip
                            key={key}
                            label={option.label}
                            size="small"
                            {...tagProps}
                            sx={{
                                bgcolor: option.color || '#2563eb',
                                color: option.textColor || '#fff',
                                fontWeight: 700, fontSize: 10,
                                height: 20,
                            }}
                        />
                    );
                })
            }
            renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                    <Box component="li" key={key} {...rest}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, py: '6px !important' }}>
                        <Chip
                            label={option.label}
                            size="small"
                            sx={{
                                bgcolor: option.color || 'transparent',
                                color: option.color ? (option.textColor || '#fff') : 'text.primary',
                                fontWeight: 700, fontSize: 11,
                                border: !option.color ? '1px solid #e5e7eb' : 'none',
                                pointerEvents: 'none',
                            }}
                        />
                    </Box>
                );
            }}
        />
    );
}

// ── Inline chip for table cell ────────────────────────────────────
function StatusChip({ value, items, showContactTooltip = false }: { value: string; items: MasterListItem[]; showContactTooltip?: boolean }) {
    if (!value) return <span style={{ color: '#9ca3af' }}>—</span>;
    
    const values = value.split(',').map(v => v.trim()).filter(Boolean);
    
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {values.map((v, idx) => {
                const found = items.find(i => i.label === v);
                const chip = (
                    <Chip key={idx} label={v} size="small" sx={{
                        bgcolor: found?.color || 'transparent',
                        color: found?.color ? (found.textColor || '#fff') : 'text.primary',
                        fontWeight: 700, fontSize: 10,
                        height: 20,
                        border: !found?.color ? '1px solid #e5e7eb' : 'none',
                    }} />
                );

                if (!showContactTooltip || !found || (!found.email && !found.contact1 && !found.contact2 && !found.contact3)) {
                    return chip;
                }

                return (
                    <Tooltip key={idx} title={
                        <Box sx={{ p: 1, minWidth: 200, maxHeight: 300, overflowY: 'auto' }}>
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#fff', display: 'block', mb: 1, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 0.5 }}>
                                {found.label}
                            </Typography>
                            {found.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                    <EmailIcon sx={{ fontSize: 16, color: '#93c5fd' }} />
                                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>{found.email}</Typography>
                                </Box>
                            )}
                            {[found.contact1, found.contact2, found.contact3].filter(Boolean).map((c, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <PhoneIcon sx={{ fontSize: 16, color: '#86efac' }} />
                                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>{c}</Typography>
                                </Box>
                            ))}
                        </Box>
                    } arrow placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>{chip}</Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
}

// ── Tender Dialog ─────────────────────────────────────────────────
const EMPTY_TENDER: Omit<Tender, 'id'> = {
    date: new Date().toISOString().slice(0, 10),
    projectCode: '', status: '', type: '', company: '', customer: '',
    supplier: '', agencyTypes: '', projectTitle: '', personInCharge: '', contactNo: '',
    email: '', internalQuotation: '',
    salesPrice: undefined, costPrice: undefined, margin: undefined,
    submissionDate: '', successRate: ''
};

function generateNextProjectCode(tenders: Tender[]): string {
    const year = new Date().getFullYear();
    const suffix = `/${year}`;
    let max = 0;
    for (const t of tenders) {
        if (t.projectCode && t.projectCode.endsWith(suffix)) {
            const match = t.projectCode.match(/^P(\d+)\/\d{4}$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > max) max = num;
            }
        }
    }
    return `P${String(max + 1).padStart(3, '0')}${suffix}`;
}

function generateNextInternalQuotation(company: string, tenders: Tender[], dateStr?: string): string {
    if (!company) return '';
    const prefix = company.toUpperCase();
    const d = dateStr ? new Date(dateStr) : new Date();
    const now = isNaN(d.getTime()) ? new Date() : d;
    const year = now.getFullYear();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const suffix = `/${year}/${day}/${month}`;
    
    let max = 0;
    const regex = new RegExp(`^${prefix}(\\d+)/${year}`);
    for (const t of tenders) {
        if (t.internalQuotation && t.internalQuotation.startsWith(prefix)) {
            const match = t.internalQuotation.match(regex);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > max) max = num;
            }
        }
    }
    return `${prefix}${String(max + 1).padStart(3, '0')}${suffix}`;
}

function TenderDialog({ open, initial, allTenders, saving, onClose, onSave }: {
    open: boolean;
    initial: Tender | null;
    allTenders: Tender[];
    saving: boolean;
    onClose: () => void;
    onSave: (t: Omit<Tender, 'id'>) => void;
}) {
    const { data } = useMasterList();
    const [form, setForm] = useState<Omit<Tender, 'id'>>(
        initial ? { ...initial } : { ...EMPTY_TENDER, projectCode: generateNextProjectCode(allTenders) }
    );
    const set = (field: keyof typeof form) => (val: string) => setForm(p => ({ ...p, [field]: val }));
    const isEdit = !!initial;
    const canSave = form.projectTitle.trim() || form.projectCode.trim();

    const [lastCompany, setLastCompany] = useState(form.company);

    useEffect(() => {
        if (form.company !== lastCompany) {
            if (form.company) {
                const nextIq = generateNextInternalQuotation(form.company, allTenders, form.date);
                
                // If there was an "extra" suffix (beyond the standard 4 parts: ID, YYYY, DD, MM)
                // preserve it. Otherwise just use the newly generated one.
                let extra = '';
                if (form.internalQuotation) {
                    const parts = form.internalQuotation.split('/');
                    if (parts.length > 4) {
                        extra = '/' + parts.slice(4).join('/');
                    }
                }
                setForm(p => ({ ...p, internalQuotation: nextIq + extra }));
            }
            setLastCompany(form.company);
        }
    }, [form.company, lastCompany, allTenders, form.date]);

    // Build unique history lists from existing tenders
    const hist = (field: keyof Tender) =>
        allTenders.map(t => t[field] as string).filter(Boolean);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

            {/* ── Gradient Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                px: 3, py: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.3px' }}>
                        {isEdit ? 'Edit Tender' : 'New Tender'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                        {isEdit ? 'Update the tender details below' : 'Fill in the details to create a new tender entry'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, py: 3 }}>
                <Grid container spacing={3}>

                    {/* ── Section 1: Reference ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />} label="Reference & Date" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="Date" type="date" value={form.date}
                                    onChange={e => set('date')(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Project Code / No" value={form.projectCode}
                                    onChange={set('projectCode')} history={hist('projectCode')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Internal Quotation" value={form.internalQuotation}
                                    onChange={set('internalQuotation')} history={hist('internalQuotation')} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FreeSoloInput label="Project Title" value={form.projectTitle}
                                    onChange={set('projectTitle')} history={hist('projectTitle')} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 2: Classification ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<TagIcon sx={{ fontSize: 15 }} />} label="Classification" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ChipAutocomplete label="Status" value={form.status}
                                    onChange={set('status')} items={data.status} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ChipAutocomplete label="Type" value={form.type}
                                    onChange={set('type')} items={data.type} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ChipAutocomplete label="Company" value={form.company}
                                    onChange={set('company')} items={data.company} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 3: Client ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<BusinessIcon sx={{ fontSize: 15 }} />} label="Client Information" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 7 }}>
                                <ChipAutocomplete label="Customer" value={form.customer}
                                    onChange={set('customer')} items={data.customer} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <ChipAutocomplete label="Agency Type" value={form.agencyTypes}
                                    onChange={set('agencyTypes')} items={data.agencyTypes} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 4: Supplier ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<BusinessIcon sx={{ fontSize: 15 }} />} label="Supplier Information" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <MultiChipAutocomplete label="Supplier" value={form.supplier}
                                    onChange={set('supplier')} items={data.supplier} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 5: Contact ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<PersonIcon sx={{ fontSize: 15 }} />} label="Point of Contact" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Person In Charge" value={form.personInCharge}
                                    onChange={set('personInCharge')} history={hist('personInCharge')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Contact No." value={form.contactNo}
                                    onChange={set('contactNo')} history={hist('contactNo')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Email" value={form.email}
                                    onChange={set('email')} history={hist('email')} type="email" />
                            </Grid>
                        </Grid>
                    </Grid>

                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button onClick={onClose} disabled={saving}
                    sx={{ textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={() => canSave && onSave(form)}
                    disabled={!canSave || saving}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, boxShadow: 'none', px: 3,
                          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                          '&:hover': { background: 'linear-gradient(135deg, #1a3354, #1d4ed8)', boxShadow: 'none' },
                          '&.Mui-disabled': { opacity: 0.45 } }}>
                    {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Tender')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Helper: map API snake_case → frontend camelCase ─────────────
function fromApi(raw: any): Tender {
    return {
        id:                String(raw.id),
        date:              raw.date              ?? '',
        projectCode:       raw.project_code      ?? '',
        status:            raw.status            ?? '',
        type:              raw.type              ?? '',
        company:           raw.company           ?? '',
        customer:          raw.customer          ?? '',
        supplier:          raw.supplier          ?? '',
        agencyTypes:       raw.agency_types      ?? '',
        projectTitle:      raw.project_title     ?? '',
        personInCharge:    raw.person_in_charge  ?? '',
        contactNo:         raw.contact_no        ?? '',
        email:             raw.email             ?? '',
        internalQuotation: raw.internal_quotation ?? '',
        salesPrice:        raw.sales_price       != null ? Number(raw.sales_price) : undefined,
        costPrice:         raw.cost_price        != null ? Number(raw.cost_price) : undefined,
        margin:            raw.margin            != null ? Number(raw.margin) : undefined,
        submissionDate:    raw.submission_date   ?? '',
        successRate:       raw.success_rate      ?? '',
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
        creator:           raw.creator           ? { id: raw.creator.id, name: raw.creator.name } : undefined,
        creatorName:       raw.creator?.name     || '—',
    };
}

function toApi(form: Omit<Tender, 'id'>) {
    return {
        date:               form.date              || null,
        project_code:       form.projectCode       || null,
        status:             form.status            || null,
        type:               form.type              || null,
        company:            form.company           || null,
        customer:           form.customer          || null,
        supplier:           form.supplier          || null,
        agency_types:       form.agencyTypes       || null,
        project_title:      form.projectTitle      || null,
        person_in_charge:   form.personInCharge    || null,
        contact_no:         form.contactNo         || null,
        email:              form.email             || null,
        internal_quotation: form.internalQuotation || null,
        sales_price:        form.salesPrice        != null ? form.salesPrice : null,
        cost_price:         form.costPrice         != null ? form.costPrice : null,
        margin:             form.margin            != null ? form.margin : null,
        submission_date:    form.submissionDate    || null,
        success_rate:       form.successRate       || null,
        po_client:          form.poClient          || null,
        bg_document:        form.bgDocument        || null,
        bg_issue_date:      form.bgIssueDate       || null,
        pr_po_procurement:  form.prPoProcurement   || null,
        delivery_order:     form.deliveryOrder     || null,
        invoice_document:   form.invoiceDocument   || null,
        project_progress_link: form.projectProgressLink || null,
        project_folder_link: form.projectFolderLink || null,
        sourcing_link:      form.sourcingLink      || null,
        quotation_link:     form.quotationLink     || null,
    };
}

// ── Main Page ─────────────────────────────────────────────────────
export default function TendersPage() {
    const navigate = useNavigate();
    const { data: masterData } = useMasterList();
    const [tenders, setTenders]     = useState<Tender[]>([]);
    const [loadingData, setLoading] = useState(true);
    const [search, setSearch]       = useState('');
    const [sortKey, setSortKey]     = useState('date');
    const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTender, setEditTender] = useState<Tender | null>(null);
    const [saving, setSaving]         = useState(false);
    const [snack, setSnack]           = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters]   = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: '',
        company: '',
        customer: '',
        agencyTypes: '',
        projectTitle: '',
    });

    const setF = (field: keyof typeof filters) => (val: string) => setFilters(p => ({ ...p, [field]: val }));
    const clearFilters = () => setFilters({ startDate: '', endDate: '', type: '', company: '', customer: '', agencyTypes: '', projectTitle: '' });

    const { authState } = useAuth();
    const currentUser = authState?.user;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Load tenders from API on mount
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

    const handleSave = async (form: Omit<Tender, 'id'>) => {
        setSaving(true);
        try {
            if (editTender) {
                const updated = await api.put(`tenders/${editTender.id}`, { json: toApi(form) }).json<any>();
                setTenders(p => p.map(t => t.id === editTender.id ? fromApi(updated) : t));
            } else {
                const created = await api.post('tenders', { json: toApi(form) }).json<any>();
                setTenders(p => [...p, fromApi(created)]);
            }
            setDialogOpen(false);
            setEditTender(null);
            setSnack({ msg: editTender ? 'Tender updated successfully.' : 'Tender added successfully.', sev: 'success' });
        } catch (err) {
            console.error('Failed to save tender', err);
            setSnack({ msg: 'Failed to save tender. Please try again.', sev: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`tenders/${id}`).json();
            setTenders(p => p.filter(t => t.id !== id));
            setSnack({ msg: 'Tender deleted.', sev: 'success' });
        } catch (err) {
            console.error('Failed to delete tender', err);
            setSnack({ msg: 'Failed to delete tender.', sev: 'error' });
        }
    };

    const openAdd  = () => { setEditTender(null); setDialogOpen(true); };
    const openEdit = (t: Tender) => { setEditTender(t); setDialogOpen(true); };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return tenders
            .filter(t => !q || Object.values(t).some(v => String(v).toLowerCase().includes(q)))
            .filter(t => !statusFilter || t.status === statusFilter)
            .filter(t => !filters.startDate || (t.date && t.date >= filters.startDate))
            .filter(t => !filters.endDate || (t.date && t.date <= filters.endDate))
            .filter(t => !filters.type || t.type === filters.type)
            .filter(t => !filters.company || t.company === filters.company)
            .filter(t => !filters.customer || t.customer === filters.customer)
            .filter(t => !filters.agencyTypes || t.agencyTypes === filters.agencyTypes)
            .filter(t => !filters.projectTitle || (t.projectTitle && t.projectTitle.toLowerCase().includes(filters.projectTitle.toLowerCase())))
            .sort((a, b) => {
                const av = (a as any)[sortKey] ?? '';
                const bv = (b as any)[sortKey] ?? '';
                return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
            });
    }, [tenders, search, statusFilter, filters, sortKey, sortDir]);

    // Build status tabs dynamically from master list with aggregated totals
    const statusTabs = useMemo(() => {
        const calcTotals = (list: Tender[]) => {
            let sales = 0;
            let cost = 0;
            list.forEach(t => {
                sales += (t.salesPrice || 0);
                cost += (t.costPrice || 0);
            });
            const gp = sales - cost;
            const margin = sales > 0 ? (gp / sales) * 100 : 0;
            return { sales, cost, gp, margin };
        };

        const allTab = { 
            label: 'All', value: '', count: tenders.length, color: '#64748b',
            totals: calcTotals(tenders),
            tenders: tenders
        };
        const otherTabs = (masterData?.status || []).map(s => {
            const list = tenders.filter(t => t.status === s.label);
            return {
                label: s.label,
                value: s.label,
                count: list.length,
                color: s.color || '#64748b',
                totals: calcTotals(list),
                tenders: list
            };
        });
        return [allTab, ...otherTabs];
    }, [masterData?.status, tenders]);

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            bgcolor: 'background.default',
        }}>

            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                           borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Tenders</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                            Manage and track all tender submissions
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField size="small" placeholder="Search tenders…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                            sx={{ width: 220 }} />
                        <Button 
                            variant={showFilters ? "contained" : "outlined"}
                            size="small"
                            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ 
                                borderRadius: 1.5, textTransform: 'none', fontWeight: 700, px: 2, height: 40,
                                borderColor: showFilters ? 'primary.main' : 'divider',
                                color: showFilters ? '#fff' : 'text.secondary',
                                bgcolor: showFilters ? 'primary.main' : 'transparent',
                                '&:hover': { bgcolor: showFilters ? 'primary.dark' : alpha('#000', 0.02) }
                            }}
                        >
                            Filters {Object.values(filters).some(v => !!v) && "•"}
                        </Button>
                        <Tooltip title="Export to CSV">
                            <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}
                            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none',
                                  background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                                  '&:hover': { background: 'linear-gradient(135deg, #1a3354, #1d4ed8)', boxShadow: 'none' } }}>
                            Add Tender
                        </Button>
                    </Box>
                </Box>
            </motion.div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderBottom: `1px solid ${theme.palette.divider}`, background: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015) }}
                    >
                        <Box sx={{ p: 2.5 }}>
                            <Grid container spacing={2} alignItems="flex-end">
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <TextField fullWidth size="small" label="From Date" type="date" value={filters.startDate} onChange={e => setF('startDate')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <TextField fullWidth size="small" label="To Date" type="date" value={filters.endDate} onChange={e => setF('endDate')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Type" value={filters.type} onChange={setF('type')} items={(masterData as any)?.type || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Company" value={filters.company} onChange={setF('company')} items={(masterData as any)?.company || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Customer" value={filters.customer} onChange={setF('customer')} items={(masterData as any)?.customer || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Agency Type" value={filters.agencyTypes} onChange={setF('agencyTypes')} items={(masterData as any)?.agencyTypes || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 10 }}>
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        label="Project Title" 
                                        value={filters.projectTitle} 
                                        onChange={e => setF('projectTitle')(e.target.value)} 
                                        placeholder="Search by project title keywords..." 
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <Button fullWidth variant="text" size="small" startIcon={<FilterAltOffIcon />} onClick={clearFilters} color="error" sx={{ fontWeight: 700, textTransform: 'none', height: 40 }}>
                                        Clear All
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Filter Bar */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', overflowX: 'auto', px: 3, gap: 3, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {statusTabs.map((tab) => {
                        const active = statusFilter === tab.value;
                        return (
                            <Tooltip key={tab.value} title={
                                <Box sx={{ p: 1, minWidth: 200 }}>
                                    <Typography variant="body2" fontWeight={800} sx={{ color: '#fff', display: 'block', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5, fontSize: 14 }}>
                                        {tab.label} Costing Totals
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Sales Price:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', fontSize: 13 }}>RM {tab.totals.sales.toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Cost Price:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', fontSize: 13 }}>RM {tab.totals.cost.toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Gross Profit:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: tab.totals.gp >= 0 ? '#10b981' : '#ef4444', fontSize: 13 }}>RM {tab.totals.gp.toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Margin:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#60a5fa', fontSize: 13 }}>{tab.totals.margin.toFixed(2)}%</Typography>
                                    </Box>
                                    
                                    {tab.tenders && tab.tenders.length > 0 && (
                                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <Typography variant="body2" fontWeight={800} sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontSize: 13 }}>
                                                Tender Breakdown
                                            </Typography>
                                            <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 } }}>
                                                {tab.tenders.map(t => (
                                                    <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="body2" sx={{ color: '#cbd5e1', mr: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, fontSize: 12 }} title={t.projectCode || t.internalQuotation || `ID: ${t.id}`}>
                                                            {t.projectCode || t.internalQuotation || `ID: ${t.id}`}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>RM {Number(t.salesPrice || 0).toLocaleString()}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            } arrow placement="bottom">
                                <Box onClick={() => setStatusFilter(tab.value)}
                                    sx={{
                                        py: 1.5, position: 'relative', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        color: active ? 'text.primary' : 'text.secondary',
                                        transition: 'color 0.2s',
                                        whiteSpace: 'nowrap',
                                        '&:hover': { color: active ? 'text.primary' : 'text.primary' }
                                    }}>
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        bgcolor: tab.color, opacity: active ? 1 : 0.5
                                    }} />
                                    <Typography variant="body2" sx={{ fontWeight: active ? 700 : 500 }}>
                                        {tab.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        bgcolor: active ? `${tab.color}22` : 'action.selected',
                                        color: active ? tab.color : 'text.secondary',
                                        px: 1, py: 0.25, borderRadius: 2, fontWeight: 700, fontSize: 10
                                    }}>
                                        {tab.count}
                                    </Typography>
                                    {active && (
                                        <Box sx={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            height: 3, bgcolor: tab.color, borderRadius: '3px 3px 0 0'
                                        }} />
                                    )}
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            {/* Table */}
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <table style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        tableLayout: 'fixed',
                        minWidth: COLUMNS.reduce((a, c) => a + c.width, 36 + 64),
                    }}>
                        <thead>
                            <tr>
                                {/* # */}
                                <th style={{ minWidth: 36, width: 36,
                                    background: 'linear-gradient(180deg, #1e3a5f 0%, #1a3354 100%)',
                                    color: '#fff', fontWeight: 700, fontSize: 11, height: 40,
                                    position: 'sticky', top: 0, left: 0, zIndex: 4,
                                    borderRight: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                                    #
                                </th>
                                {COLUMNS.map(col => (
                                    <HeaderCell key={col.id} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                ))}
                                {/* Actions */}
                                <th style={{ minWidth: 104, width: 104,
                                    background: 'linear-gradient(180deg, #1e3a5f 0%, #1a3354 100%)',
                                    color: '#fff', fontWeight: 700, fontSize: 11, height: 40,
                                    position: 'sticky', top: 0, right: 0, zIndex: 4, textAlign: 'center',
                                    borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                                    ⋯
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={COLUMNS.length + 2} style={{ textAlign: 'center', padding: '80px 24px' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 64, height: 64, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #1e3a5f22, #2563eb22)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                                <AddIcon sx={{ fontSize: 28, color: '#2563eb', opacity: 0.6 }} />
                                            </Box>
                                            <Typography variant="h6" fontWeight={700} color="text.secondary">
                                                {search ? 'No matching tenders' : 'No tenders yet'}
                                            </Typography>
                                            <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 320, textAlign: 'center' }}>
                                                {search ? 'Try a different search term.' : <>Click <strong>Add Tender</strong> to create your first entry.</>}
                                            </Typography>
                                            {!search && (
                                                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAdd}
                                                    sx={{ mt: 1, fontWeight: 700, textTransform: 'none', borderRadius: 1.5, borderColor: '#2563eb', color: '#2563eb' }}>
                                                    Add Tender
                                                </Button>
                                            )}
                                        </Box>
                                    </td>
                                </tr>
                            ) : filtered.map((tender, idx) => (
                                <motion.tr
                                    key={tender.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15, delay: idx * 0.03 }}
                                    style={{ background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}
                                >
                                    <td style={{ 
                                        textAlign: 'center', fontSize: 12, color: theme.palette.text.secondary, padding: '8px 0', 
                                        borderBottom: `1px solid ${theme.palette.divider}`, position: 'sticky', left: 0, 
                                        background: idx % 2 === 0 ? theme.palette.background.default : (isDark ? '#1e293b' : '#f8fafc'), zIndex: 2, 
                                        borderRight: `1px solid ${theme.palette.divider}` 
                                    }}>{idx + 1}</td>
                                    {COLUMNS.map(col => {
                                        const val = (tender as any)[col.id];
                                        const isMasterField = ['status', 'type', 'company', 'customer', 'supplier', 'agencyTypes'].includes(col.id);
                                        const categoryMap: any = { status: 'status', type: 'type', company: 'company', customer: 'customer', supplier: 'supplier', agencyTypes: 'agencyTypes' };
                                        const showTooltip = ['customer', 'supplier', 'company', 'agencyTypes'].includes(col.id);
                                        const isLongText = ['projectTitle', 'email', 'personInCharge'].includes(col.id);
                                        
                                        return (
                                            <td key={col.id} style={{
                                                padding: '8px 12px', fontSize: 11,
                                                color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                maxWidth: col.width,
                                            }}>
                                                {isMasterField ? (
                                                    <StatusChip value={val} items={(masterData as any)[categoryMap[col.id]]} showContactTooltip={showTooltip} />
                                                ) : isLongText && val ? (
                                                    <Tooltip title={val} arrow placement="top">
                                                        <span style={{ 
                                                            display: 'block', 
                                                            overflow: 'hidden', 
                                                            textOverflow: 'ellipsis', 
                                                            whiteSpace: 'nowrap',
                                                            cursor: 'default'
                                                        }}>
                                                            {val}
                                                        </span>
                                                    </Tooltip>
                                                ) : (
                                                    val || <span style={{ color: theme.palette.text.disabled }}>—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ 
                                        padding: '4px 8px', borderBottom: `1px solid ${theme.palette.divider}`, textAlign: 'center',
                                        position: 'sticky', right: 0, background: idx % 2 === 0 ? theme.palette.background.default : (isDark ? '#1e293b' : '#f8fafc'), 
                                        zIndex: 2, borderLeft: `1px solid ${theme.palette.divider}`
                                    }}>
                                        {(() => {
                                            const isCreator = !tender.creator || (currentUser && tender.creator.id == (currentUser as any).id) || (currentUser as any)?.role === 'admin';
                                            return (
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <Tooltip title="Tender Costing">
                                                        <IconButton size="small" onClick={() => navigate(`/businesses/tenders/${tender.id}/costing`)} sx={{ color: '#10b981' }}>
                                                            <AttachMoneyIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {isCreator ? (
                                                        <>
                                                            <Tooltip title="Edit Tender">
                                                                <IconButton size="small" onClick={() => openEdit(tender)} sx={{ color: '#2563eb' }}>
                                                                    <EditIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete Tender">
                                                                <IconButton size="small" onClick={() => handleDelete(tender.id)} sx={{ color: '#ef4444' }}>
                                                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <Tooltip title="View Only (Created by another user)">
                                                            <span>
                                                                <IconButton size="small" disabled sx={{ opacity: 0.3 }}>
                                                                    <EditIcon sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            );
                                        })()}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </Box>

            {/* Footer */}
            <Box sx={{ px: 3, py: 1, borderTop: '1px solid', borderColor: 'divider',
                       display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
                <Typography variant="caption" color="text.disabled">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                    {tenders.length !== filtered.length ? ` (filtered from ${tenders.length})` : ''}
                </Typography>
            </Box>

            {/* Tender Dialog */}
            {dialogOpen && (
                <TenderDialog
                    open={dialogOpen}
                    initial={editTender}
                    allTenders={tenders}
                    saving={saving}
                    onClose={() => { if (!saving) { setDialogOpen(false); setEditTender(null); } }}
                    onSave={handleSave}
                />
            )}

            {/* Feedback toast */}
            <Snackbar
                open={!!snack}
                autoHideDuration={3500}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}
                    sx={{ fontWeight: 600, borderRadius: 2 }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

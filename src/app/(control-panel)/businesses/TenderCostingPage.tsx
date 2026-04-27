import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';

const SUCCESS_RATES = [
    { value: '10% Submission', color: '#991b1b', bgcolor: '#fee2e2' },
    { value: '50%, Project created by us', color: '#9a3412', bgcolor: '#ffedd5' },
    { value: '75%, Negotiated & High Chance to award', color: '#3f6212', bgcolor: '#ecfccb' },
    { value: '100%, Pending Official Award', color: '#065f46', bgcolor: '#d1fae5' },
];

export default function TenderCostingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tender, setTender] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const { authState } = useAuth();
    const currentUser = authState?.user;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    
    const canEdit = tender && (!tender.creator || (currentUser && tender.creator.id == (currentUser as any).id) || (currentUser as any)?.role === 'admin');
    
    // Tender Summary Form
    const [form, setForm] = useState({
        internal_quotation: '',
        sales_price: '',
        cost_price: '',
        submission_date: '',
        success_rate: ''
    });

    // New Item Form
    const [newItem, setNewItem] = useState({
        item_name: '', quantity: 1, unit_cost: 0, unit_price: 0
    });

    useEffect(() => {
        if (id) {
            api.get(`tenders/${id}`).json().then(data => {
                setTender(data);
                setForm({
                    internal_quotation: (data as any).internal_quotation || '',
                    sales_price: (data as any).sales_price || '',
                    cost_price: (data as any).cost_price || '',
                    submission_date: (data as any).submission_date || '',
                    success_rate: (data as any).success_rate || ''
                });
            }).catch(console.error);

            fetchItems();
        }
    }, [id]);

    const fetchItems = () => {
        api.get(`tenders/${id}/costing-items`).json().then(data => setItems(data as any[])).catch(console.error);
    };

    const handleSaveSummary = async () => {
        setSaving(true);
        try {
            const payload: any = { 
                internal_quotation: form.internal_quotation || null,
                submission_date: form.submission_date || null,
                success_rate: form.success_rate || null
            };
            if (items.length === 0) {
                payload.sales_price = form.sales_price !== '' ? Number(form.sales_price) : null;
                payload.cost_price = form.cost_price !== '' ? Number(form.cost_price) : null;
                payload.margin = (payload.sales_price || 0) - (payload.cost_price || 0);
            }

            const res = await api.put(`tenders/${id}`, { json: payload }).json();
            setTender(res);
            setIsEditing(false);
        } catch (e: any) {
            console.error(e);
            if (e.response) {
                const errJson = await e.response.json().catch(() => ({}));
                console.error("API Error details:", errJson);
                alert("Save failed: " + (errJson.message || e.message));
            } else {
                alert("Save failed: " + e.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancelSummary = () => {
        if (tender) {
            setForm({
                internal_quotation: tender.internal_quotation || '',
                sales_price: tender.sales_price || '',
                cost_price: tender.cost_price || '',
                submission_date: tender.submission_date || '',
                success_rate: tender.success_rate || ''
            });
        }
        setIsEditing(false);
    };

    const handleAddItem = async () => {
        if (!newItem.item_name) return;
        try {
            await api.post(`tenders/${id}/costing-items`, { json: newItem });
            setNewItem({ item_name: '', quantity: 1, unit_cost: 0, unit_price: 0 });
            fetchItems();
            // Refresh tender to get updated totals from backend calculation
            const updatedTender = await api.get(`tenders/${id}`).json();
            setTender(updatedTender);
            setForm(prev => ({
                ...prev, 
                sales_price: (updatedTender as any).sales_price || '', 
                cost_price: (updatedTender as any).cost_price || '' 
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`tenders/${id}/costing-items/${itemId}`);
            fetchItems();
            const updatedTender = await api.get(`tenders/${id}`).json();
            setTender(updatedTender);
            setForm(prev => ({
                ...prev, 
                sales_price: (updatedTender as any).sales_price || '', 
                cost_price: (updatedTender as any).cost_price || '' 
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const sales = Number(form.sales_price) || 0;
    const cost = Number(form.cost_price) || 0;
    const margin = sales - cost;
    const marginPercent = sales > 0 ? ((margin / sales) * 100).toFixed(1) : 0;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            bgcolor: 'background.default',
        }}>
            {/* Page Header */}
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/businesses/tenders')} size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Tender Costing</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ mt: 0.25, display: 'block', color: 'text.secondary' }}>
                            Financial calculations and breakdown for Tender: {tender?.project_code || `ID ${id}`}
                        </Typography>
                    </Box>
                </Box>
                
                {tender && (
                    <Box>
                        {!isEditing ? (
                            canEdit && (
                                <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2, background: '#10b981', '&:hover': { background: '#059669' } }}>
                                    Edit Summary
                                </Button>
                            )
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={handleCancelSummary} disabled={saving}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSaveSummary} disabled={saving}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Content Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {tender ? (
                    <>
                        {/* Summary Green Bar */}
                        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', mb: 4 }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Internal Quotation</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Sales Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Cost Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Margin (RM)</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Submission Date</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600 }}>
                                            {isEditing ? (
                                                <TextField size="small" fullWidth value={form.internal_quotation} onChange={e => setForm({ ...form, internal_quotation: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                tender.internal_quotation || <span style={{ color: theme.palette.text.disabled, fontWeight: 400 }}>Not set</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            {isEditing && items.length === 0 ? (
                                                <TextField size="small" fullWidth type="number" value={form.sales_price} onChange={e => setForm({ ...form, sales_price: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                <Typography variant="body2" fontWeight={600} sx={{ color: items.length > 0 && isEditing ? 'text.disabled' : 'inherit' }}>
                                                    {tender.sales_price ? `RM ${Number(tender.sales_price).toLocaleString()}` : '—'}
                                                    {items.length > 0 && isEditing && <span style={{display:'block', fontSize: 10, fontWeight: 400}}>Auto-calculated from items</span>}
                                                </Typography>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            {isEditing && items.length === 0 ? (
                                                <TextField size="small" fullWidth type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                <Typography variant="body2" fontWeight={600} sx={{ color: items.length > 0 && isEditing ? 'text.disabled' : 'inherit' }}>
                                                    {tender.cost_price ? `RM ${Number(tender.cost_price).toLocaleString()}` : '—'}
                                                    {items.length > 0 && isEditing && <span style={{display:'block', fontSize: 10, fontWeight: 400}}>Auto-calculated from items</span>}
                                                </Typography>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: margin >= 0 ? '#10b981' : '#ef4444' }}>
                                                    RM {margin.toLocaleString()}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{marginPercent}%</Typography>
                                            </Box>
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            {isEditing ? (
                                                <TextField size="small" fullWidth type="date" value={form.submission_date} onChange={e => setForm({ ...form, submission_date: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                <Typography variant="body2">{tender.submission_date || '—'}</Typography>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {isEditing ? (
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    value={form.success_rate}
                                                    onChange={e => setForm({ ...form, success_rate: e.target.value as string })}
                                                    displayEmpty
                                                    sx={{ borderRadius: 1.5, fontSize: 13, '& .MuiSelect-select': { py: 1 } }}
                                                >
                                                    <MenuItem value="" disabled>Select Rate</MenuItem>
                                                    {SUCCESS_RATES.map(rate => (
                                                        <MenuItem key={rate.value} value={rate.value} sx={{ fontSize: 13, fontWeight: 500 }}>
                                                            <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: rate.bgcolor, color: rate.color }}>
                                                                {rate.value}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            ) : (
                                                tender.success_rate ? (() => {
                                                    const rateDef = SUCCESS_RATES.find(r => r.value === tender.success_rate);
                                                    return (
                                                        <Box sx={{ 
                                                            display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 13, fontWeight: 600,
                                                            bgcolor: rateDef ? rateDef.bgcolor : '#f1f5f9',
                                                            color: rateDef ? rateDef.color : '#475569'
                                                        }}>
                                                            {tender.success_rate}
                                                        </Box>
                                                    );
                                                })() : <Typography variant="body2">—</Typography>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>

                        {/* Costing Items Table */}
                        <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px" mb={2}>Costing Items Breakdown</Typography>
                        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Item Name</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '80px' }}>Qty</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Unit Cost (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Unit Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Total Cost (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Total Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Markup (%)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Margin (%)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>GP (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}`, width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const totalCost = item.quantity * item.unit_cost;
                                        const totalPrice = item.quantity * item.unit_price;
                                        const gp = totalPrice - totalCost;
                                        const markup = totalCost > 0 ? (gp / totalCost) * 100 : 0;
                                        const margin = totalPrice > 0 ? (gp / totalPrice) * 100 : 0;
                                        return (
                                        <tr key={item.id}>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{item.item_name}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{item.quantity}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{Number(item.unit_cost).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{Number(item.unit_price).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600 }}>{totalCost.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600, color: '#10b981' }}>{totalPrice.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{markup.toFixed(2)}%</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{margin.toFixed(2)}%</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600, color: gp >= 0 ? '#10b981' : '#ef4444' }}>{gp.toLocaleString()}</td>
                                            <td style={{ padding: '8px', borderBottom: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                                                {canEdit && (
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                    
                                    {/* Add New Item Row */}
                                    {canEdit && (() => {
                                        const newTotalCost = newItem.quantity * newItem.unit_cost;
                                        const newTotalPrice = newItem.quantity * newItem.unit_price;
                                        const newGp = newTotalPrice - newTotalCost;
                                        const newMarkup = newTotalCost > 0 ? (newGp / newTotalCost) * 100 : 0;
                                        const newMargin = newTotalPrice > 0 ? (newGp / newTotalPrice) * 100 : 0;
                                        return (
                                        <tr style={{ background: isDark ? '#1e293b' : '#f8fafc' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <TextField size="small" fullWidth placeholder="Item name..." 
                                                value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }} />
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <TextField size="small" fullWidth type="number" 
                                                value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }} />
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <TextField size="small" fullWidth type="number" 
                                                value={newItem.unit_cost} onChange={e => setNewItem({...newItem, unit_cost: Number(e.target.value)})}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }} />
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <TextField size="small" fullWidth type="number" 
                                                value={newItem.unit_price} onChange={e => setNewItem({...newItem, unit_price: Number(e.target.value)})}
                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }} />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                                            {newTotalCost.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                                            {newTotalPrice.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14 }}>{newMarkup.toFixed(2)}%</td>
                                        <td style={{ padding: '12px 16px', fontSize: 14 }}>{newMargin.toFixed(2)}%</td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: newGp >= 0 ? '#10b981' : '#ef4444' }}>
                                            {newGp.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <IconButton size="small" sx={{ bgcolor: '#2563eb', color: '#fff', '&:hover': { bgcolor: '#1d4ed8' } }} 
                                                onClick={handleAddItem} disabled={!newItem.item_name}>
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                    );
                                    })()}
                                </tbody>
                            </table>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <Typography color="text.secondary">Loading costing data...</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

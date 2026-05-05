import React, { useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SignatureCanvas from 'react-signature-canvas';
import RefreshIcon from '@mui/icons-material/Refresh';

type Tender = any;
type CostingItem = any;

interface TenderCostingReportDialogProps {
    open: boolean;
    onClose: () => void;
    tender: Tender;
    items: CostingItem[];
    currentUser: any;
    onVerify?: (signature: string) => void;
    onApprove?: (signature: string) => void;
}

export default function TenderCostingReportDialog({
    open,
    onClose,
    tender,
    items,
    currentUser,
    onVerify,
    onApprove
}: TenderCostingReportDialogProps) {
    const theme = useTheme();
    const printRef = useRef<HTMLDivElement>(null);
    const sigPad = useRef<any>(null);
    const [signing, setSigning] = useState(false);
    const [actionType, setActionType] = useState<'verify' | 'approve' | null>(null);

    if (!tender) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableRows = items.map((item, idx) => `
            <tr>
                <td style="text-align: center; border: 1px solid #000;">${idx + 1}</td>
                <td style="border: 1px solid #000;">${item.item_name || ''}</td>
                <td style="border: 1px solid #000;"></td>
                <td style="border: 1px solid #000;"></td>
                <td style="text-align: center; border: 1px solid #000;">${item.quantity || 0}</td>
                <td style="text-align: right; border: 1px solid #000;">${(Number(item.unit_cost) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; border: 1px solid #000;">${(Number(item.quantity) * Number(item.unit_cost)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; border: 1px solid #000;">0.00</td>
                <td style="text-align: right; border: 1px solid #000;">${(Number(item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; border: 1px solid #000;">${(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; border: 1px solid #000;">0.00</td>
                <td style="text-align: center; border: 1px solid #000;">0.00%</td>
                <td style="text-align: center; border: 1px solid #000;">0.00%</td>
                <td style="text-align: right; border: 1px solid #000;">0.00</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Costing Report - ${tender.projectCode || ''}</title>
                    <style>
                        @page { size: landscape; margin: 10mm; }
                        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 20px; }
                        .header { font-weight: bold; text-decoration: underline; font-size: 14px; margin-bottom: 20px; text-transform: uppercase; }
                        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
                        .info-table td { padding: 2px; border: none !important; font-size: 11px; }
                        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .main-table th, .main-table td { border: 1px solid black; padding: 4px; font-size: 9px; }
                        .main-table th { background-color: #f0f0f0; font-weight: bold; }
                        .signature-section { display: flex; justify-content: space-between; margin-top: 60px; }
                        .sig-box { width: 22%; border-top: 1px solid black; padding-top: 5px; position: relative; min-height: 80px; }
                        .sig-img { height: 50px; position: absolute; top: -55px; left: 10px; z-index: 10; }
                        .totals { background-color: #ffffcc !important; font-weight: bold; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    </style>
                </head>
                <body>
                    <div class="header">LATEST COSTING TEMPLATE (${new Date().toLocaleDateString('en-GB')})</div>
                    
                    <table class="info-table">
                        <tr><td width="150"><b>Company</b></td><td>: ${tender.company || ''}</td></tr>
                        <tr><td><b>Ref No</b></td><td>: ${tender.internalQuotation || tender.internal_quotation || ''}</td></tr>
                        <tr><td><b>Date</b></td><td>: ${tender.date || ''}</td></tr>
                        <tr><td><b>Customer</b></td><td>: ${tender.customer || ''}</td></tr>
                        <tr><td><b>Project Name</b></td><td>: ${tender.projectTitle || tender.project_title || ''}</td></tr>
                        <tr><td><b>Project Type</b></td><td>: ${tender.type || ''}</td></tr>
                    </table>

                    <table class="main-table">
                        <thead>
                            <tr>
                                <th>NO</th><th>Specification</th><th>Details</th><th>Quotation Breakdown</th><th>Qty</th>
                                <th>Unit Cost (RM)</th><th>Total Cost (RM)</th><th>SST</th>
                                <th>Unit Price (RM)</th><th>Total Price (RM)</th><th>SST (8%)</th>
                                <th>Markup%</th><th>Margin%</th><th>GP (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                            <tr class="totals">
                                <td colspan="4" style="text-align:right; border: 1px solid #000;">TOTALS</td>
                                <td style="text-align:center; border: 1px solid #000;">-</td>
                                <td style="text-align:center; border: 1px solid #000;">-</td>
                                <td style="text-align:right; border: 1px solid #000;">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style="text-align:right; border: 1px solid #000;">0.00</td>
                                <td style="text-align:center; border: 1px solid #000;">-</td>
                                <td style="text-align:right; border: 1px solid #000;">${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style="text-align:right; border: 1px solid #000;">0.00</td>
                                <td style="text-align:center; border: 1px solid #000;">${totalMarkup.toFixed(2)}%</td>
                                <td style="text-align:center; border: 1px solid #000;">${totalMargin.toFixed(2)}%</td>
                                <td style="text-align:right; border: 1px solid #000;">${totalGp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="signature-section">
                        <div class="sig-box">
                            <b>Prepared By:</b><br>${tender.creatorName || tender.creator?.name || ''}<br>
                            <small>${tender.createdAt ? new Date(tender.createdAt).toLocaleString() : ''}</small>
                        </div>
                        <div class="sig-box">
                            ${tender.verifier_signature ? `<img src="${tender.verifier_signature}" class="sig-img">` : ''}
                            <b>Checked By:</b><br>${tender.verifier?.name || ''}<br>
                            <small>${tender.verified_at ? new Date(tender.verified_at).toLocaleString() : ''}</small>
                        </div>
                        <div class="sig-box">
                            ${tender.verifier_signature ? `<img src="${tender.verifier_signature}" class="sig-img">` : ''}
                            <b>Verified By:</b><br>${tender.verifier?.name || ''}<br>
                            <small>${tender.verified_at ? new Date(tender.verified_at).toLocaleString() : ''}</small>
                        </div>
                        <div class="sig-box">
                            ${tender.approver_signature ? `<img src="${tender.approver_signature}" class="sig-img">` : ''}
                            <b>Approved By:</b><br>${tender.approver?.name || ''}<br>
                            <small>${tender.approved_at ? new Date(tender.approved_at).toLocaleString() : ''}</small>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for signatures to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1500);
    };

    const role = currentUser?.role;
    const userRoles = Array.isArray(role) ? role : [role];
    const isSuperAdmin = userRoles.includes('superadmin');
    const isAdmin = userRoles.includes('admin');
    const isSupervisor = userRoles.includes('supervisor');
    
    const vStatus = tender.verification_status;

    // Calculations
    const totalCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0);
    const totalPrice = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const sstSales = totalPrice * 0.08;
    const totalSalesWithSst = totalPrice + sstSales;
    const totalGp = totalPrice - totalCost;
    const totalMargin = totalPrice > 0 ? (totalGp / totalPrice) * 100 : 0;
    const totalMarkup = totalCost > 0 ? (totalGp / totalCost) * 100 : 0;

    const startSigning = (type: 'verify' | 'approve') => {
        setActionType(type);
        setSigning(true);
    };

    const handleConfirmSignature = () => {
        if (!sigPad.current || sigPad.current.isEmpty()) {
            alert("Please sign before confirming.");
            return;
        }
        const signature = sigPad.current.toDataURL('image/png');
        if (actionType === 'verify' && onVerify) onVerify(signature);
        if (actionType === 'approve' && onApprove) onApprove(signature);
        setSigning(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
            <Box sx={{ 
                p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: '#fff'
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Costing Report Analysis</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Auto-generated summary with digital signature support</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="contained" size="small" 
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                        Print Report
                    </Button>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent sx={{ p: 4, bgcolor: '#f1f5f9' }}>
                {signing ? (
                    <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom fontWeight={700}>
                            Please Sign using Mouse or Touch
                        </Typography>
                        <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, mb: 3, display: 'inline-block', bgcolor: '#f8fafc' }}>
                            <SignatureCanvas 
                                ref={sigPad}
                                canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }}
                                penColor="black"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button variant="outlined" onClick={() => setSigning(false)}>Cancel</Button>
                            <Button variant="outlined" color="warning" startIcon={<RefreshIcon />} onClick={() => sigPad.current?.clear()}>Clear</Button>
                            <Button variant="contained" color="primary" onClick={handleConfirmSignature}>Confirm & Submit</Button>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box ref={printRef} sx={{ 
                            bgcolor: '#fff', p: 5, borderRadius: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            width: '1100px', mx: 'auto',
                            '& table': { borderCollapse: 'collapse', width: '100%', mb: 4 },
                            '& th, & td': { border: '1px solid #000', p: 1, fontSize: '11px', fontFamily: 'Tahoma, sans-serif' }
                        }}>
                            {/* Report Header */}
                            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 3, textTransform: 'uppercase', textDecoration: 'underline', color: '#000' }}>
                                LATEST COSTING TEMPLATE ({new Date().toLocaleDateString('en-GB')})
                            </Typography>

                            {/* Info Grid */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0.5, mb: 4, color: '#000' }}>
                                <Typography variant="caption" fontWeight={900}>Company</Typography>
                                <Typography variant="caption">: {tender.company || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Ref No</Typography>
                                <Typography variant="caption">: {tender.internalQuotation || tender.internal_quotation || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Date</Typography>
                                <Typography variant="caption">: {tender.date || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Customer</Typography>
                                <Typography variant="caption">: {tender.customer || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Project Name</Typography>
                                <Typography variant="caption">: {tender.projectTitle || tender.project_title || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Project Type</Typography>
                                <Typography variant="caption">: {tender.type || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Closing Date</Typography>
                                <Typography variant="caption">: {tender.submissionDate || tender.submission_date || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Project Owner</Typography>
                                <Typography variant="caption">: {tender.creatorName || tender.creator?.name || '—'}</Typography>
                            </Box>

                            {/* Main Table */}
                            <table>
                                <thead>
                                    <tr>
                                        <th rowSpan={2} style={{ width: '35px' }}>NO</th>
                                        <th rowSpan={2} style={{ width: '200px' }}>Specification</th>
                                        <th rowSpan={2} style={{ width: '120px' }}>Details</th>
                                        <th rowSpan={2} style={{ width: '150px' }}>Quotation Breakdown</th>
                                        <th rowSpan={2} style={{ width: '45px' }}>Qty</th>
                                        <th colSpan={3} style={{ backgroundColor: '#cffafe' }}>Costing</th>
                                        <th colSpan={3} style={{ backgroundColor: '#fee2e2' }}>SALES</th>
                                        <th colSpan={3} style={{ backgroundColor: '#e2e8f0' }}>MARKUP</th>
                                    </tr>
                                    <tr>
                                        <th style={{ backgroundColor: '#cffafe' }}>Unit Cost</th>
                                        <th style={{ backgroundColor: '#cffafe' }}>Total Cost (RM)</th>
                                        <th style={{ backgroundColor: '#cffafe' }}>SST</th>
                                        <th style={{ backgroundColor: '#fee2e2' }}>Unit price</th>
                                        <th style={{ backgroundColor: '#fee2e2' }}>Total Price (RM)</th>
                                        <th style={{ backgroundColor: '#fee2e2' }}>SST (8%)</th>
                                        <th style={{ backgroundColor: '#e2e8f0' }}>MARKUP (%)</th>
                                        <th style={{ backgroundColor: '#e2e8f0' }}>Margin (%)</th>
                                        <th style={{ backgroundColor: '#e2e8f0' }}>GP (RM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const tc = Number(item.quantity) * Number(item.unit_cost);
                                        const tp = Number(item.quantity) * Number(item.unit_price);
                                        const sst = tp * 0.08;
                                        const gp = tp - tc;
                                        const markup = tc > 0 ? (gp / tc) * 100 : 0;
                                        const margin = tp > 0 ? (gp / tp) * 100 : 0;
                                        return (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                <td>{item.item_name}</td>
                                                <td>—</td>
                                                <td>—</td>
                                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right' }}>{Number(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{tc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>0.00</td>
                                                <td style={{ textAlign: 'right' }}>{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{tp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{sst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{markup.toFixed(1)}%</td>
                                                <td style={{ textAlign: 'right' }}>{margin.toFixed(1)}%</td>
                                                <td style={{ textAlign: 'right' }}>{gp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Empty rows */}
                                    {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`} style={{ height: '24px' }}>
                                            {Array.from({ length: 14 }).map((__, j) => <td key={j}></td>)}
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: '#fef9c3', fontWeight: 'bold' }}>
                                        <td colSpan={5} style={{ textAlign: 'right', fontSize: '12px' }}>TOTALS</td>
                                        <td style={{ textAlign: 'right' }}>—</td>
                                        <td style={{ textAlign: 'right' }}>{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>0.00</td>
                                        <td style={{ textAlign: 'right' }}>—</td>
                                        <td style={{ textAlign: 'right' }}>{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>{sstSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>{totalMarkup.toFixed(2)}%</td>
                                        <td style={{ textAlign: 'right' }}>{totalMargin.toFixed(2)}%</td>
                                        <td style={{ textAlign: 'right', backgroundColor: '#fef08a' }}>{totalGp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} rowSpan={2} style={{ border: 'none' }}></td>
                                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#cffafe' }}>Total Cost with SST</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#fef08a' }}>{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#fee2e2' }}>Total Sales Price with SST</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#fef08a' }}>{totalSalesWithSst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td colSpan={3} style={{ border: 'none' }}></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Signature Blocks */}
                            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                                <Box sx={{ width: '22%' }}>
                                    <Typography variant="caption" fontWeight={700} display="block">Prepared By :</Typography>
                                    <Box sx={{ mt: 5, borderTop: '1px solid #000', pt: 0.5 }}>
                                        <Typography variant="caption" fontWeight={900} display="block">{tender.creatorName || tender.creator?.name || ''}</Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>Date/Time: {tender.createdAt ? new Date(tender.createdAt).toLocaleString() : ''}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '22%' }}>
                                    <Typography variant="caption" fontWeight={700} display="block">Checked By :</Typography>
                                    <Box sx={{ mt: 5, borderTop: '1px solid #000', pt: 0.5, minHeight: '60px' }}>
                                        {tender.verifier_signature && <img src={tender.verifier_signature} alt="sig" style={{ height: '40px', marginBottom: '-10px' }} />}
                                        <Typography variant="caption" fontWeight={900} display="block">{tender.verifier?.name || ''}</Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>Date/Time: {tender.verified_at ? new Date(tender.verified_at).toLocaleString() : ''}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '22%' }}>
                                    <Typography variant="caption" fontWeight={700} display="block">Verified By :</Typography>
                                    <Box sx={{ mt: 5, borderTop: '1px solid #000', pt: 0.5, minHeight: '60px' }}>
                                        {tender.verifier_signature && <img src={tender.verifier_signature} alt="sig" style={{ height: '40px', marginBottom: '-10px' }} />}
                                        <Typography variant="caption" fontWeight={900} display="block">{tender.verifier?.name || ''}</Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>Date/Time: {tender.verified_at ? new Date(tender.verified_at).toLocaleString() : ''}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '22%' }}>
                                    <Typography variant="caption" fontWeight={700} display="block">Approved By :</Typography>
                                    <Box sx={{ mt: 5, borderTop: '1px solid #000', pt: 0.5, minHeight: '60px' }}>
                                        {tender.approver_signature && <img src={tender.approver_signature} alt="sig" style={{ height: '40px', marginBottom: '-10px' }} />}
                                        <Typography variant="caption" fontWeight={900} display="block">{tender.approver?.name || ''}</Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>Date/Time: {tender.approved_at ? new Date(tender.approved_at).toLocaleString() : ''}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', gap: 2, bgcolor: '#f8fafc' }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3 }}>
                    Close Preview
                </Button>
                
                {!signing && (vStatus === 'pending_supervisor') && (isSupervisor || isSuperAdmin) && onVerify && (
                    <Button variant="contained" color="secondary" startIcon={<CheckCircleOutlineIcon />} onClick={() => startSigning('verify')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 4, boxShadow: 'none' }}>
                        Verify & Request Approval
                    </Button>
                )}
                
                {!signing && (vStatus === 'pending_superadmin' || (vStatus === 'pending_supervisor' && isSuperAdmin)) && (isSuperAdmin || isAdmin) && onApprove && (
                    <Button variant="contained" color="success" startIcon={<DoneAllIcon />} onClick={() => startSigning('approve')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 4, boxShadow: 'none' }}>
                        Final Approval
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

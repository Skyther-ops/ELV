import { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import api from '@/utils/api';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import CheckIcon from '@mui/icons-material/Check';

export default function NotificationBell() {
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await api.get('notifications').json<any[]>();
            setNotifications(data);
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const iv = setInterval(fetchNotifications, 15000); // Check every 15s
        return () => clearInterval(iv);
    }, [user]);

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };

    const markAsRead = async (id: string) => {
        try {
            await api.post(`notifications/${id}/read`);
            setNotifications(p => p.filter(n => n.id !== id));
        } catch (e) {
            console.error('Failed to mark as read');
        }
    };

    const markAllRead = async () => {
        setLoading(true);
        try {
            await api.post('notifications/mark-all-read');
            setNotifications([]);
        } catch (e) {
            console.error('Failed to mark all as read');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 320, p: 2, borderRadius: 2 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                    {notifications.length > 0 && (
                        <Button size="small" onClick={markAllRead} disabled={loading} sx={{ textTransform: 'none' }}>
                            {loading ? <CircularProgress size={14} /> : 'Mark all read'}
                        </Button>
                    )}
                </Box>
                
                {notifications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        No new notifications
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
                        {notifications.map(n => (
                            <Box key={n.id} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="body2" sx={{ flex: 1, pr: 1 }}>{n.data.message || 'New notification'}</Typography>
                                <IconButton size="small" onClick={() => markAsRead(n.id)} sx={{ mt: -0.5, mr: -0.5 }}>
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
            </Popover>
        </>
    );
}

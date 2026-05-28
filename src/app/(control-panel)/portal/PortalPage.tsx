import { useNavigate } from 'react-router';
import useUser from '@auth/useUser';
import Typography from '@mui/material/Typography';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useProject } from '@/context/ProjectContext';

function PortalPage() {
    const { data: user } = useUser();
    const navigate = useNavigate();
    const { setViewMode } = useProject();

    const userRoleStr = typeof user?.role === 'string' ? user.role : (Array.isArray(user?.role) ? user.role[0] : 'user');
    const roleLower = String(userRoleStr || 'user').toLowerCase();
    
    const isSuperAdmin = roleLower === 'superadmin';
    const isSupervisor = ['supervisor', 'admin'].includes(roleLower) || isSuperAdmin;
    const isFacilitator = roleLower === 'facilitator';
    const isMember = roleLower === 'member';
    const isBusiness = ['businesses', 'business_admin', 'business_higher_admin'].includes(roleLower);
    const isIct = roleLower === 'ict';

    // Display role name based on user data
    let displayRole = 'User';
    if (isSuperAdmin) displayRole = 'Super Admin';
    else if (isSupervisor) displayRole = 'System Supervisor';
    else if (roleLower === 'business_admin') displayRole = 'Project Manager';
    else if (roleLower === 'business_higher_admin') displayRole = 'General Manager';
    else if (isBusiness) displayRole = 'Business Partner';
    else if (isFacilitator) displayRole = 'SSDC Facilitator';
    else if (isMember) displayRole = 'Team Member';
    else if (isIct) displayRole = 'ICT Admin';

    const systems = [
        {
            id: 'elv',
            title: 'ELV SYSTEM',
            desc: 'Manage Construction progress and SSDC operations.',
            icon: <ElectricalServicesIcon sx={{ fontSize: 40 }} />,
            color: '#3b82f6', // Blue
            gradient: 'from-blue-600 to-blue-400',
            route: '/select-project',
            hasAccess: isSupervisor || isFacilitator || isMember
        },
        {
            id: 'ict',
            title: 'ICT SYSTEM',
            desc: 'Integrated Information and Communication Technology management.',
            icon: <LaptopMacIcon sx={{ fontSize: 40 }} />,
            color: '#a855f7', // Purple
            gradient: 'from-purple-600 to-purple-400',
            route: '/ict-dashboard', // Placeholder
            hasAccess: isSupervisor || isIct
        },
        {
            id: 'business',
            title: 'BUSINESS SYSTEM',
            desc: 'Corporate services and general business administration.',
            icon: <BusinessIcon sx={{ fontSize: 40 }} />,
            color: '#f59e0b', // Orange/Yellow
            gradient: 'from-amber-500 to-amber-400',
            route: '/businesses',
            hasAccess: isSupervisor || isBusiness
        },
        {
            id: 'inventory',
            title: 'INVENTORY SYSTEM',
            desc: 'Standalone hardware inventory and documentation management.',
            icon: <InventoryIcon sx={{ fontSize: 40 }} />,
            color: '#10b981', // Green
            gradient: 'from-emerald-500 to-emerald-400',
            route: '/inventory-dashboard', // Placeholder
            hasAccess: isSupervisor || isMember || isFacilitator // Allowing members/facilitators for now
        }
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#1e1b4b' }}>
            {/* Background Gradient overlay */}
            <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(circle at 50% 0%, #312e81 0%, transparent 70%)' }}></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-7xl px-4 py-12">
                {/* Header Logo */}
                <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
                    <ElectricalServicesIcon sx={{ fontSize: 40, color: 'white' }} />
                </div>
                
                <Typography variant="h3" className="font-black text-white tracking-widest uppercase mb-2">
                    Unified System
                </Typography>
                
                <Typography variant="subtitle1" className="text-indigo-200 mb-16">
                    Welcome back, <span className="font-bold text-white">{displayRole}</span>. Select a system to continue.
                    <br/><span className="text-xs text-red-400">Debug role data: {JSON.stringify(user?.role)}</span>
                </Typography>

                {/* System Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {systems.map((sys) => (
                        <div 
                            key={sys.id} 
                            className={`flex flex-col items-center p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                                sys.hasAccess 
                                ? 'bg-indigo-950/40 border-indigo-500/30 hover:bg-indigo-900/60 hover:border-indigo-400 hover:-translate-y-1 shadow-xl' 
                                : 'bg-indigo-950/20 border-white/5 opacity-60 grayscale-[0.5]'
                            }`}
                        >
                            {/* Icon Container */}
                            <div 
                                className={`flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg`}
                                style={{ 
                                    background: sys.hasAccess ? `linear-gradient(135deg, ${sys.color}40, ${sys.color}10)` : 'rgba(255,255,255,0.05)',
                                    border: sys.hasAccess ? `1px solid ${sys.color}50` : '1px solid rgba(255,255,255,0.1)',
                                    color: sys.hasAccess ? sys.color : '#94a3b8'
                                }}
                            >
                                {sys.icon}
                            </div>

                            <Typography variant="h6" className="font-bold text-white tracking-widest mb-3 text-center">
                                {sys.title}
                            </Typography>
                            
                            <Typography variant="body2" className="text-indigo-200/70 text-center mb-8 min-h-[60px]">
                                {sys.desc}
                            </Typography>

                            <div className="mt-auto w-full">
                                {sys.hasAccess ? (
                                    <button
                                        onClick={() => {
                                            setViewMode(sys.id as any);
                                            navigate(sys.route);
                                        }}
                                        className={`w-full py-3 rounded-xl font-bold text-white text-sm tracking-wider uppercase transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95`}
                                        style={{ background: `linear-gradient(to right, ${sys.color}, ${sys.color}dd)` }}
                                    >
                                        Enter System
                                    </button>
                                ) : (
                                    <div className="w-full py-3 rounded-xl font-bold text-slate-500 text-sm tracking-wider uppercase text-center bg-white/5 border border-white/10">
                                        No Access
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-16 text-indigo-300/40 text-xs tracking-widest uppercase font-semibold">
                    © 2026 UNIFIED ENTERPRISE MANAGEMENT SYSTEM
                </div>
            </div>
        </div>
    );
}

export default PortalPage;

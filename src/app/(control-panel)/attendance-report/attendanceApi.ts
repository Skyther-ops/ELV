import api from '@/utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AttendanceRecord {
    id: number;
    project_id: number;
    user_id: string;
    user?: {
        id: string;
        name: string;
        role?: string;
    };
    user_name: string;
    date: string;      // 'yyyy-MM-dd'
    status: string;
    remarks?: string;          // Used for personal facilitator notes
    personal_remark?: string;  // Future: after DB migration
    assigned_by?: string;
    assigned_by_name?: string;
    created_at: string;
    updated_at: string;
}

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            return await api.get('users').json<any[]>();
        }
    });
};

export const useAttendance = (projectId?: number, month?: string) => {
    return useQuery({
        queryKey: ['attendance', projectId, month],
        queryFn: async () => {
            if (!projectId) return [];
            const params: Record<string, any> = { project_id: projectId };
            if (month) params.month = month;
            return await api.get('attendance', { searchParams: params }).json<AttendanceRecord[]>();
        },
        enabled: !!projectId,
        staleTime: 30_000,
    });
};

export const useAddAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            project_id: number;
            user_id: string;
            user_name: string;
            date: string;
            status: string;
            remarks?: string;
            assigned_by?: string;
            assigned_by_name?: string;
        }) => {
            return await api.post('attendance', { json: data }).json<AttendanceRecord>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.project_id] });
        },
    });
};

export const useUpdateAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<AttendanceRecord> & { project_id: number } }) => {
            return await api.put(`attendance/${id}`, { json: data }).json<AttendanceRecord>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.data.project_id] });
        },
    });
};

/**
 * Upsert a personal remark for the logged-in facilitator.
 * Uses the existing 'remarks' field so no DB migration needed.
 * Stores a 'Note' status record for remark-only days.
 */
export const useUpsertPersonalRemark = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            user_id: string;
            user_name: string;
            project_id: number;
            date: string;
            personal_remark: string;
        }) => {
            // Use the standard attendance store with remarks field
            return await api.post('attendance', {
                json: {
                    user_id: data.user_id,
                    user_name: data.user_name,
                    project_id: data.project_id,
                    date: data.date,
                    status: 'Note',
                    remarks: data.personal_remark,
                }
            }).json<AttendanceRecord>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.project_id] });
        },
    });
};

export const useDeleteAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
            return await api.delete(`attendance/${id}`).json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.projectId] });
        },
    });
};

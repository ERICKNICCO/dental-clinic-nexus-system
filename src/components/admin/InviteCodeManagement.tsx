
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Copy,
    RefreshCw,
    Plus,
    Trash2,
    Ticket,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import { UserRole, getRoleDisplayName, getAllRoles } from '@/config/rbac';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':4000') : 'http://localhost:4000');

interface InviteCode {
    id: string;
    code: string;
    role: UserRole;
    max_uses: number;
    uses_count: number;
    is_active: boolean;
    created_at: string;
    expires_at?: string;
}

const InviteCodeManagement = () => {
    const { toast } = useToast();
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [newCode, setNewCode] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('staff' as UserRole);
    const [maxUses, setMaxUses] = useState('1');
    const [expiresInDays, setExpiresInDays] = useState('7');

    useEffect(() => {
        fetchInviteCodes();
    }, []);

    const fetchInviteCodes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/invite-codes`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invite codes');
            }

            const data = await response.json();
            setInviteCodes(data.inviteCodes || []);
        } catch (error: any) {
            console.error('Error fetching invite codes:', error);
            // Don't show toast on initial load error to avoid spamming if backend is just waking up
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInviteCode = async () => {
        if (!newCode || !selectedRole) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            setCreating(true);
            const token = localStorage.getItem('authToken');

            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

            const response = await fetch(`${API_BASE_URL}/admin/invite-codes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: newCode,
                    role: selectedRole,
                    maxUses: parseInt(maxUses),
                    expiresAt: expiresAt.toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create invite code');
            }

            toast({
                title: 'Success',
                description: 'Invite code created successfully',
            });

            fetchInviteCodes();
            setIsCreateOpen(false);
            // Reset form
            setNewCode('');
            setSelectedRole('staff' as UserRole);
            setMaxUses('1');
        } catch (error: any) {
            console.error('Error creating invite code:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create invite code',
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivateCode = async (codeId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/invite-codes/${codeId}/deactivate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to deactivate code');
            }

            toast({
                title: 'Success',
                description: 'Invite code deactivated',
            });

            fetchInviteCodes();
        } catch (error: any) {
            console.error('Error deactivating code:', error);
            toast({
                title: 'Error',
                description: 'Failed to deactivate code',
                variant: 'destructive',
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied',
            description: 'Invite code copied to clipboard',
        });
    };

    const generateRandomCode = () => {
        const prefix = selectedRole.substring(0, 3).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setNewCode(`${prefix}-${random}`);
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-yellow-500" />
                        Invite Codes
                    </CardTitle>
                    <CardDescription>
                        Manage registration codes for new staff members
                    </CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Invite Code</DialogTitle>
                            <DialogDescription>
                                Generate a code that allows new users to register with a specific role.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(val) => {
                                            setSelectedRole(val as UserRole);
                                            // Auto-update code prefix if user hasn't typed a custom one or just generated one
                                            if (newCode.includes('-')) {
                                                const random = Math.random().toString(36).substring(2, 8).toUpperCase();
                                                setNewCode(`${val.substring(0, 3).toUpperCase()}-${random}`);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAllRoles().map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {getRoleDisplayName(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Uses</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newCode}
                                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="E.g., STAFF-2025"
                                    />
                                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                                        Generate
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Expires In (Days)</Label>
                                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Day</SelectItem>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                        <SelectItem value="365">1 Year</SelectItem>
                                        <SelectItem value="3650">Never</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreateInviteCode}
                                disabled={creating}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Code
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : inviteCodes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                            <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No invite codes found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500 bg-gray-50/50">
                                        <th className="py-2 px-3 font-medium">Code</th>
                                        <th className="py-2 px-3 font-medium">Role</th>
                                        <th className="py-2 px-3 font-medium">Usage</th>
                                        <th className="py-2 px-3 font-medium">Status</th>
                                        <th className="py-2 px-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {inviteCodes.map((invite) => (
                                        <tr key={invite.id} className="hover:bg-gray-50/50">
                                            <td className="py-3 px-3 font-mono font-medium text-gray-900">
                                                {invite.code}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {getRoleDisplayName(invite.role)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-gray-600">
                                                {invite.uses_count} / {invite.max_uses}
                                            </td>
                                            <td className="py-3 px-3">
                                                {invite.is_active ? (
                                                    <span className="flex items-center text-green-600 text-xs font-medium">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600 text-xs font-medium">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => copyToClipboard(invite.code)}
                                                    >
                                                        <Copy className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    {invite.is_active && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeactivateCode(invite.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default InviteCodeManagement;

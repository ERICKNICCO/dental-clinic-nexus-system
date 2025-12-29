
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    Users,
    Shield,
    Edit,
    Trash2,
    Search,
    UserPlus,
    Mail,
    Phone,
    Briefcase,
    CheckCircle,
    XCircle,
    Key
} from 'lucide-react';
import { UserRole, getRoleDisplayName, getAllRoles } from '@/config/rbac';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useSidebarCollapseOnMobile } from '@/hooks/useSidebarCollapseOnMobile';
import InviteCodeManagement from '@/components/admin/InviteCodeManagement';

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':4000') : 'http://localhost:4000');

interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    specialization?: string;
    license_number?: string;
    created_at: string;
}

const UserManagementPage = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Layout state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    useSidebarCollapseOnMobile(setIsSidebarCollapsed);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                throw new Error('Failed to update role');
            }

            toast({
                title: 'Success',
                description: 'User role updated successfully',
            });

            fetchUsers();
            setIsEditDialogOpen(false);
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update role',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            toast({
                title: 'Success',
                description: 'User deleted successfully',
            });

            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete user',
                variant: 'destructive',
            });
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = selectedRole === 'all' || user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (role: UserRole) => {
        const colors: Record<UserRole, string> = {
            admin: 'bg-red-100 text-red-800',
            dentist: 'bg-blue-100 text-blue-800',
            receptionist: 'bg-green-100 text-green-800',
            dental_assistant: 'bg-purple-100 text-purple-800',
            technician: 'bg-orange-100 text-orange-800',
            finance_manager: 'bg-yellow-100 text-yellow-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden w-full bg-gray-50">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-[70px]' : 'ml-64'}`}>
                <Header toggleSidebar={toggleSidebar} />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    <Shield className="h-8 w-8 text-yellow-500" />
                                    User Management
                                </h1>
                                <p className="text-gray-600 mt-2">Manage staff roles and permissions</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                                    <div className="text-sm text-gray-500 font-medium">Total Users</div>
                                    <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search by name or email..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    {/* Role Filter */}
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            {getAllRoles().map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {getRoleDisplayName(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Users Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Staff Members</CardTitle>
                                <CardDescription>
                                    {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-md border text-sm">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Name</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Email</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Phone</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Role</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Specialization</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                                        No users found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <Users className="h-4 w-4 text-yellow-600" />
                                                                </div>
                                                                <span className="font-medium text-gray-900">{user.full_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                                {user.email}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                                {user.phone || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role).replace('bg-', 'bg-opacity-10 border-')}`}>
                                                                {getRoleDisplayName(user.role)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                                                                {user.specialization || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                                                    setIsEditDialogOpen(open);
                                                                    if (!open) setEditingUser(null);
                                                                }}>
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setEditingUser(user)}
                                                                            className="h-8 w-8 p-0"
                                                                        >
                                                                            <Edit className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit User Role</DialogTitle>
                                                                            <DialogDescription>
                                                                                Change the role for {user.full_name}
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="space-y-4 py-4">
                                                                            <div className="space-y-2">
                                                                                <Label>Current Role</Label>
                                                                                <div className={`w-fit px-3 py-1 rounded-md text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                                                                                    {getRoleDisplayName(user.role)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label>New Role</Label>
                                                                                <Select
                                                                                    defaultValue={user.role}
                                                                                    onValueChange={(value) => handleUpdateRole(user.id, value as UserRole)}
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
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-700" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Invite Code Management */}
                        <div className="mt-8">
                            <InviteCodeManagement />
                        </div>

                        {/* Role Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                            {getAllRoles().map(role => {
                                const count = users.filter(u => u.role === role).length;
                                // Simplified badge colors for cards to look cleaner
                                const roleColorClass = getRoleBadgeColor(role);

                                return (
                                    <Card key={role} className="overflow-hidden border-t-4 border-t-gray-200 hover:border-t-yellow-400 transition-colors">
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-bold mb-2 ${roleColorClass}`}>
                                                    {getRoleDisplayName(role)}
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{count}</div>
                                                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                                                    {count === 1 ? 'user' : 'users'}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserManagementPage;

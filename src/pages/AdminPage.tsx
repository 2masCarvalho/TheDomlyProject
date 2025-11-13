import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Trash2, UserPlus, LogOut } from 'lucide-react';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  nome: z.string().min(2, 'Name must be at least 2 characters'),
  empresa: z.string().optional(),
  role: z.enum(['admin', 'user']),
});

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    empresa: '',
    role: 'user' as 'admin' | 'user',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Access denied. Please login.');
        navigate('/login');
        return;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roleData) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form data
      const validatedData = userSchema.parse(formData);

      // Create user using Supabase admin API
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            nome: validatedData.nome,
            empresa: validatedData.empresa || null,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // If role is admin, add admin role
      if (validatedData.role === 'admin') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin',
          });

        if (roleError) throw roleError;
      }

      toast.success('User created successfully');
      setFormData({ email: '', password: '', nome: '', empresa: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.errors) {
        // Zod validation errors
        error.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error.message || 'Failed to create user');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner text="Checking access..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Manage users and platform access</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
            <CardDescription>
              Add a new user to the platform with specified role and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Name *</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Full name"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Company</Label>
                  <Input
                    id="empresa"
                    type="text"
                    placeholder="Company name (optional)"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting ? 'Creating User...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage existing users and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.empresa || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.user_roles?.some((r: any) => r.role === 'admin')
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.user_roles?.some((r: any) => r.role === 'admin') ? 'Admin' : 'User'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

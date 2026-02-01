import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  UserCheck,
  Calculator
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { trackDataOperation } from '@/services/storageTrackingService';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  role: string;
  department: string;
  joining_date: string;
  salary_type: string;
  base_salary: number;
  status: string;
  profile_image_url?: string;
  address?: string;
  emergency_contact?: string;
  created_at: string;
}

interface EmployeeFormData {
  full_name: string;
  mobile_number: string;
  email: string;
  role: string;
  department: string;
  joining_date: Date;
  salary_type: string;
  base_salary: string;
  address: string;
  emergency_contact: string;
  profile_image_url: string;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: '',
    mobile_number: '',
    email: '',
    role: '',
    department: '',
    joining_date: new Date(),
    salary_type: 'Monthly',
    base_salary: '',
    address: '',
    emergency_contact: '',
    profile_image_url: ''
  });

  const roles = ['Sales', 'Technician', 'Office Staff', 'Manager'];
  const salaryTypes = ['Monthly', 'Daily', 'Hourly'];
  const departments = ['Sales', 'Technical', 'Administration', 'HR', 'Finance', 'Marketing'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employeeData = {
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        joining_date: format(formData.joining_date, 'yyyy-MM-dd'),
        salary_type: formData.salary_type,
        base_salary: parseFloat(formData.base_salary),
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        profile_image_url: formData.profile_image_url
      };

      let result;
      if (selectedEmployee) {
        // Update existing employee
        result = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', selectedEmployee.id)
          .select()
          .single();
        
        if (!result.error) {
          // Track update operation
          await trackDataOperation({
            operation_type: 'update',
            table_name: 'employees',
            operation_source: 'admin_employee_update',
            metadata: {
              employee_id: selectedEmployee.employee_id,
              employee_name: formData.full_name,
              role: formData.role,
              department: formData.department,
              salary_type: formData.salary_type,
              base_salary: parseFloat(formData.base_salary),
              admin_action: 'employee_profile_update'
            }
          });
          toast.success('Employee updated successfully');
        }
      } else {
        // Create new employee
        result = await supabase
          .from('employees')
          .insert([employeeData])
          .select()
          .single();
        
        if (!result.error) {
          // Track create operation
          await trackDataOperation({
            operation_type: 'create',
            table_name: 'employees',
            operation_source: 'admin_employee_create',
            metadata: {
              employee_name: formData.full_name,
              role: formData.role,
              department: formData.department,
              salary_type: formData.salary_type,
              base_salary: parseFloat(formData.base_salary),
              joining_date: format(formData.joining_date, 'yyyy-MM-dd'),
              admin_action: 'new_employee_registration'
            }
          });
          toast.success('Employee created successfully');
        }
      }

      if (result.error) throw result.error;

      fetchEmployees();
      resetForm();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name}?`)) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      // Track delete operation
      await trackDataOperation({
        operation_type: 'delete',
        table_name: 'employees',
        operation_source: 'admin_employee_delete',
        metadata: {
          employee_id: employee.employee_id,
          employee_name: employee.full_name,
          role: employee.role,
          department: employee.department,
          admin_action: 'employee_removal'
        }
      });

      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const handleStatusToggle = async (employee: Employee) => {
    const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
    
    try {
      const { error } = await supabase
        .from('employees')
        .update({ status: newStatus })
        .eq('id', employee.id);

      if (error) throw error;

      // Track status change
      await trackDataOperation({
        operation_type: 'update',
        table_name: 'employees',
        operation_source: 'admin_employee_status',
        metadata: {
          employee_id: employee.employee_id,
          employee_name: employee.full_name,
          old_status: employee.status,
          new_status: newStatus,
          admin_action: 'status_change'
        }
      });

      toast.success(`Employee ${newStatus.toLowerCase()} successfully`);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      mobile_number: '',
      email: '',
      role: '',
      department: '',
      joining_date: new Date(),
      salary_type: 'Monthly',
      base_salary: '',
      address: '',
      emergency_contact: '',
      profile_image_url: ''
    });
    setSelectedEmployee(null);
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      mobile_number: employee.mobile_number,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      joining_date: new Date(employee.joining_date),
      salary_type: employee.salary_type,
      base_salary: employee.base_salary.toString(),
      address: employee.address || '',
      emergency_contact: employee.emergency_contact || '',
      profile_image_url: employee.profile_image_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Manager': return <Briefcase className="h-4 w-4" />;
      case 'Sales': return <DollarSign className="h-4 w-4" />;
      case 'Technician': return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage your employees, roles, and basic information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <EmployeeForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              roles={roles}
              departments={departments}
              salaryTypes={salaryTypes}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {employees.filter(e => e.status === 'Active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {employees.filter(e => e.status === 'Inactive').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold">
                  {new Set(employees.map(e => e.department)).size}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {employee.profile_image_url ? (
                      <img 
                        src={employee.profile_image_url} 
                        alt={employee.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600">
                        {employee.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{employee.full_name}</h3>
                    <p className="text-sm text-gray-500">{employee.employee_id}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getRoleIcon(employee.role)}
                  <span>{employee.role} • {employee.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{employee.mobile_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>{employee.salary_type}: ₹{employee.base_salary.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openViewDialog(employee)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(employee)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusToggle(employee)}
                  className={employee.status === 'Active' ? 'text-red-600' : 'text-green-600'}
                >
                  {employee.status === 'Active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(employee)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first employee'
              }
            </p>
            {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            roles={roles}
            departments={departments}
            salaryTypes={salaryTypes}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeDetails employee={selectedEmployee} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Employee Form Component
const EmployeeForm = ({ formData, setFormData, onSubmit, roles, departments, salaryTypes, isEdit = false }: any) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="mobile_number">Mobile Number *</Label>
          <Input
            id="mobile_number"
            value={formData.mobile_number}
            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role: string) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept: string) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="joining_date">Joining Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.joining_date ? format(formData.joining_date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.joining_date}
                onSelect={(date) => date && setFormData({ ...formData, joining_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="salary_type">Salary Type *</Label>
          <Select value={formData.salary_type} onValueChange={(value) => setFormData({ ...formData, salary_type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select salary type" />
            </SelectTrigger>
            <SelectContent>
              {salaryTypes.map((type: string) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="base_salary">
            Base Salary * 
            <span className="text-sm text-gray-500 ml-1">
              ({formData.salary_type === 'Monthly' ? '₹/month' : formData.salary_type === 'Daily' ? '₹/day' : '₹/hour'})
            </span>
          </Label>
          <Input
            id="base_salary"
            type="number"
            step="0.01"
            value={formData.base_salary}
            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="emergency_contact">Emergency Contact</Label>
          <Input
            id="emergency_contact"
            value={formData.emergency_contact}
            onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label>Profile Image</Label>
        <ImageUpload
          value={formData.profile_image_url}
          onChange={(url) => setFormData({ ...formData, profile_image_url: url })}
          bucket="employee-profiles"
          path="profiles"
          uploadSource="employee_profiles"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {isEdit ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
};

// Employee Details Component
const EmployeeDetails = ({ employee }: { employee: Employee }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          {employee.profile_image_url ? (
            <img 
              src={employee.profile_image_url} 
              alt={employee.full_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-gray-600">
              {employee.full_name.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{employee.full_name}</h3>
          <p className="text-gray-600">{employee.employee_id}</p>
          <Badge className={employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {employee.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Role:</span>
            <span>{employee.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Department:</span>
            <span>{employee.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Mobile:</span>
            <span>{employee.mobile_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Email:</span>
            <span>{employee.email}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Joining Date:</span>
            <span>{format(new Date(employee.joining_date), 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Salary Type:</span>
            <span>{employee.salary_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Base Salary:</span>
            <span>₹{employee.base_salary.toLocaleString()}</span>
          </div>
          {employee.emergency_contact && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Emergency:</span>
              <span>{employee.emergency_contact}</span>
            </div>
          )}
        </div>
      </div>

      {employee.address && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Address:</span>
          </div>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">{employee.address}</p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>Created: {format(new Date(employee.created_at), 'PPP')}</p>
      </div>
    </div>
  );
};

export default EmployeeManagement;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  Plus,
  Filter,
  Download,
  Eye,
  UserCheck,
  UserX,
  Timer,
  Coffee,
  Home
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackDataOperation } from '@/services/storageTrackingService';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
  department: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  working_hours?: number;
  notes?: string;
  is_locked: boolean;
  employee?: Employee;
}

interface AttendanceFormData {
  employee_id: string;
  attendance_date: Date;
  status: string;
  check_in_time: string;
  check_out_time: string;
  working_hours: string;
  notes: string;
}

const AttendanceManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const [formData, setFormData] = useState<AttendanceFormData>({
    employee_id: '',
    attendance_date: new Date(),
    status: 'Present',
    check_in_time: '09:00',
    check_out_time: '18:00',
    working_hours: '8',
    notes: ''
  });

  const attendanceStatuses = [
    { value: 'Present', label: 'Present', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'Absent', label: 'Absent', icon: XCircle, color: 'bg-red-100 text-red-800' },
    { value: 'Half Day', label: 'Half Day', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Leave', label: 'Leave', icon: Coffee, color: 'bg-blue-100 text-blue-800' },
    { value: 'Holiday', label: 'Holiday', icon: Home, color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [selectedDate, selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_id, full_name, role, department, status')
        .eq('status', 'Active')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('employee_attendance')
        .select(`
          *,
          employee:employees(id, employee_id, full_name, role, department, status)
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const attendanceData = {
        employee_id: formData.employee_id,
        attendance_date: format(formData.attendance_date, 'yyyy-MM-dd'),
        status: formData.status,
        check_in_time: formData.status === 'Present' || formData.status === 'Half Day' ? formData.check_in_time : null,
        check_out_time: formData.status === 'Present' || formData.status === 'Half Day' ? formData.check_out_time : null,
        working_hours: formData.status === 'Present' ? parseFloat(formData.working_hours) : 
                      formData.status === 'Half Day' ? parseFloat(formData.working_hours) / 2 : 0,
        notes: formData.notes
      };

      let result;
      if (selectedRecord) {
        // Update existing record
        result = await supabase
          .from('employee_attendance')
          .update(attendanceData)
          .eq('id', selectedRecord.id)
          .select()
          .single();
        
        if (!result.error) {
          const employee = employees.find(e => e.id === formData.employee_id);
          await trackDataOperation({
            operation_type: 'update',
            table_name: 'employee_attendance',
            operation_source: 'admin_attendance_update',
            metadata: {
              employee_id: employee?.employee_id,
              employee_name: employee?.full_name,
              attendance_date: format(formData.attendance_date, 'yyyy-MM-dd'),
              old_status: selectedRecord.status,
              new_status: formData.status,
              working_hours: attendanceData.working_hours,
              admin_action: 'attendance_modification'
            }
          });
          toast.success('Attendance updated successfully');
        }
      } else {
        // Create new record
        result = await supabase
          .from('employee_attendance')
          .insert([attendanceData])
          .select()
          .single();
        
        if (!result.error) {
          const employee = employees.find(e => e.id === formData.employee_id);
          await trackDataOperation({
            operation_type: 'create',
            table_name: 'employee_attendance',
            operation_source: 'admin_attendance_mark',
            metadata: {
              employee_id: employee?.employee_id,
              employee_name: employee?.full_name,
              attendance_date: format(formData.attendance_date, 'yyyy-MM-dd'),
              status: formData.status,
              working_hours: attendanceData.working_hours,
              admin_action: 'daily_attendance_marking'
            }
          });
          toast.success('Attendance marked successfully');
        }
      }

      if (result.error) throw result.error;

      fetchAttendance();
      resetForm();
      setIsMarkDialogOpen(false);
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      if (error.code === '23505') {
        toast.error('Attendance already marked for this employee on this date');
      } else {
        toast.error('Failed to save attendance');
      }
    }
  };

  const handleBulkMarkAttendance = async (status: string) => {
    if (!confirm(`Mark all active employees as ${status} for ${format(selectedDate, 'PPP')}?`)) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingAttendance = attendance.filter(a => a.attendance_date === dateStr);
      const employeesToMark = employees.filter(emp => 
        !existingAttendance.some(att => att.employee_id === emp.id)
      );

      if (employeesToMark.length === 0) {
        toast.info('All employees already have attendance marked for this date');
        return;
      }

      const attendanceRecords = employeesToMark.map(emp => ({
        employee_id: emp.id,
        attendance_date: dateStr,
        status: status,
        check_in_time: status === 'Present' ? '09:00:00' : null,
        check_out_time: status === 'Present' ? '18:00:00' : null,
        working_hours: status === 'Present' ? 8 : status === 'Half Day' ? 4 : 0,
        notes: `Bulk marked as ${status}`
      }));

      const { error } = await supabase
        .from('employee_attendance')
        .insert(attendanceRecords);

      if (error) throw error;

      // Track bulk operation
      await trackDataOperation({
        operation_type: 'create',
        table_name: 'employee_attendance',
        operation_source: 'admin_attendance_bulk',
        metadata: {
          attendance_date: dateStr,
          status: status,
          employees_count: employeesToMark.length,
          employee_names: employeesToMark.map(e => e.full_name).join(', '),
          admin_action: 'bulk_attendance_marking'
        }
      });

      toast.success(`Marked ${employeesToMark.length} employees as ${status}`);
      fetchAttendance();
    } catch (error: any) {
      console.error('Error bulk marking attendance:', error);
      toast.error('Failed to bulk mark attendance');
    }
  };

  const openEditDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      employee_id: record.employee_id,
      attendance_date: new Date(record.attendance_date),
      status: record.status,
      check_in_time: record.check_in_time || '09:00',
      check_out_time: record.check_out_time || '18:00',
      working_hours: record.working_hours?.toString() || '8',
      notes: record.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      attendance_date: selectedDate,
      status: 'Present',
      check_in_time: '09:00',
      check_out_time: '18:00',
      working_hours: '8',
      notes: ''
    });
    setSelectedRecord(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = attendanceStatuses.find(s => s.value === status);
    if (!statusConfig) return null;

    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getDailyAttendance = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.filter(a => a.attendance_date === dateStr);
  };

  const getEmployeeAttendance = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(a => a.employee_id === employeeId && a.attendance_date === dateStr);
  };

  const getMonthlyStats = () => {
    const totalDays = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const absentCount = attendance.filter(a => a.status === 'Absent').length;
    const halfDayCount = attendance.filter(a => a.status === 'Half Day').length;
    const leaveCount = attendance.filter(a => a.status === 'Leave').length;
    const holidayCount = attendance.filter(a => a.status === 'Holiday').length;

    return {
      total: totalDays,
      present: presentCount,
      absent: absentCount,
      halfDay: halfDayCount,
      leave: leaveCount,
      holiday: holidayCount
    };
  };

  const filteredAttendance = attendance.filter(record => {
    const matchesEmployee = filterEmployee === 'all' || record.employee_id === filterEmployee;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesEmployee && matchesStatus;
  });

  const monthlyStats = getMonthlyStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-600">Track and manage employee attendance</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
              </DialogHeader>
              <AttendanceForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleMarkAttendance}
                employees={employees}
                attendanceStatuses={attendanceStatuses}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{monthlyStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{monthlyStats.present}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{monthlyStats.absent}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Half Day</p>
                <p className="text-2xl font-bold text-yellow-600">{monthlyStats.halfDay}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leave</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyStats.leave}</p>
              </div>
              <Coffee className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Holiday</p>
                <p className="text-2xl font-bold text-purple-600">{monthlyStats.holiday}</p>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Calendar</TabsTrigger>
          <TabsTrigger value="records">All Records</TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Daily Attendance - {format(selectedDate, 'PPP')}
                </CardTitle>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Change Date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkMarkAttendance('Present')}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark All Present
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkMarkAttendance('Holiday')}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Mark Holiday
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => {
                  const attendanceRecord = getEmployeeAttendance(employee.id, selectedDate);
                  return (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            {employee.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.full_name}</h4>
                          <p className="text-sm text-gray-600">{employee.employee_id} • {employee.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {attendanceRecord ? (
                          <>
                            {getStatusBadge(attendanceRecord.status)}
                            {attendanceRecord.check_in_time && (
                              <span className="text-sm text-gray-600">
                                {attendanceRecord.check_in_time} - {attendanceRecord.check_out_time}
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(attendanceRecord)}
                              disabled={attendanceRecord.is_locked}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                employee_id: employee.id,
                                attendance_date: selectedDate
                              });
                              setIsMarkDialogOpen(true);
                            }}
                          >
                            Mark Attendance
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Calendar */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Monthly Calendar - {format(selectedMonth, 'MMMM yyyy')}</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Change Month
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => date && setSelectedMonth(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {eachDayOfInterval({
                  start: startOfMonth(selectedMonth),
                  end: endOfMonth(selectedMonth)
                }).map(date => {
                  const dailyAttendance = getDailyAttendance(date);
                  const presentCount = dailyAttendance.filter(a => a.status === 'Present').length;
                  const totalEmployees = employees.length;
                  
                  return (
                    <div
                      key={date.toISOString()}
                      className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                        isToday(date) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="text-sm font-medium">{format(date, 'd')}</div>
                      {dailyAttendance.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          {presentCount}/{totalEmployees}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Records */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Attendance Records</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {attendanceStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                          {record.employee?.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{record.employee?.full_name}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(record.attendance_date), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(record.status)}
                      {record.check_in_time && (
                        <span className="text-sm text-gray-600">
                          {record.check_in_time} - {record.check_out_time}
                        </span>
                      )}
                      {record.working_hours && (
                        <span className="text-sm text-gray-600">
                          {record.working_hours}h
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(record)}
                        disabled={record.is_locked}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredAttendance.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendance records found</h3>
                  <p className="text-gray-600">Start by marking attendance for your employees</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <AttendanceForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleMarkAttendance}
            employees={employees}
            attendanceStatuses={attendanceStatuses}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Attendance Form Component
const AttendanceForm = ({ formData, setFormData, onSubmit, employees, attendanceStatuses, isEdit = false }: any) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="employee_id">Employee *</Label>
        <Select 
          value={formData.employee_id} 
          onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
          disabled={isEdit}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp: any) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="attendance_date">Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.attendance_date ? format(formData.attendance_date, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.attendance_date}
              onSelect={(date) => date && setFormData({ ...formData, attendance_date: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="status">Status *</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {attendanceStatuses.map((status: any) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(formData.status === 'Present' || formData.status === 'Half Day') && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_time">Check In Time</Label>
              <Input
                id="check_in_time"
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="check_out_time">Check Out Time</Label>
              <Input
                id="check_out_time"
                type="time"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="working_hours">Working Hours</Label>
            <Input
              id="working_hours"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.working_hours}
              onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {isEdit ? 'Update Attendance' : 'Mark Attendance'}
        </Button>
      </div>
    </form>
  );
};

export default AttendanceManagement;
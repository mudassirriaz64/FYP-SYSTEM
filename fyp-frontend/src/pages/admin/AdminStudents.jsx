import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  Award,
  Key
} from 'lucide-react';

const API_BASE = 'http://localhost:5073/api';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToResetPassword, setStudentToResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    enrollmentId: { part1: '', part2: '', part3: '' },
    fullName: '',
    email: '',
    phone: '',
    departmentId: '',
    batch: '',
    semester: '',
    cgpa: '',
    isActive: true,
    createLoginAccount: false,
    username: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Import state
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Fetch departments for dropdown
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE}/departments?pageSize=100`);
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (departmentFilter !== 'all') params.append('departmentId', departmentFilter);
      if (batchFilter !== 'all') params.append('batch', batchFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active');

      const response = await fetch(`${API_BASE}/students?${params}`);
      const data = await response.json();

      setStudents(data.students || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, searchQuery, departmentFilter, batchFilter, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle enrollment ID part changes
  const handleEnrollmentChange = (part, value) => {
    const numericValue = value.replace(/\D/g, '');
    if (part === 'part1' && numericValue.length <= 2) {
      setFormData(prev => ({
        ...prev,
        enrollmentId: { ...prev.enrollmentId, part1: numericValue }
      }));
      if (numericValue.length === 2) {
        document.getElementById('enrollment-part2')?.focus();
      }
    } else if (part === 'part2' && numericValue.length <= 6) {
      setFormData(prev => ({
        ...prev,
        enrollmentId: { ...prev.enrollmentId, part2: numericValue }
      }));
      if (numericValue.length === 6) {
        document.getElementById('enrollment-part3')?.focus();
      }
    } else if (part === 'part3' && numericValue.length <= 3) {
      setFormData(prev => ({
        ...prev,
        enrollmentId: { ...prev.enrollmentId, part3: numericValue }
      }));
    }
  };

  // Open modal for create/edit
  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      // Parse enrollment ID
      const parts = student.enrollmentId.split('-');
      setFormData({
        enrollmentId: {
          part1: parts[0] || '',
          part2: parts[1] || '',
          part3: parts[2] || ''
        },
        fullName: student.fullName,
        email: student.email,
        phone: student.phone || '',
        departmentId: student.departmentId?.toString() || '',
        batch: student.batch || '',
        semester: student.semester || '',
        cgpa: student.cgpa || '',
        isActive: student.isActive,
        createLoginAccount: student.hasLoginAccount,
        username: '',
        password: ''
      });
    } else {
      setEditingStudent(null);
      setFormData({
        enrollmentId: { part1: '', part2: '', part3: '' },
        fullName: '',
        email: '',
        phone: '',
        departmentId: '',
        batch: '',
        semester: '',
        cgpa: '',
        isActive: true,
        createLoginAccount: false,
        username: '',
        password: ''
      });
    }
    setFormErrors({});
    setSubmitError('');
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormErrors({});
    setSubmitError('');
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.enrollmentId.part1 || !formData.enrollmentId.part2 || !formData.enrollmentId.part3) {
      errors.enrollmentId = 'Enrollment ID is required (XX-XXXXXX-XXX)';
    } else if (formData.enrollmentId.part1.length !== 2 || formData.enrollmentId.part2.length !== 6 || formData.enrollmentId.part3.length !== 3) {
      errors.enrollmentId = 'Invalid Enrollment ID format (XX-XXXXXX-XXX)';
    }
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (formData.createLoginAccount) {
      if (!formData.password.trim()) errors.password = 'Password is required when creating login account';
      if (formData.password && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitError('');

    try {
      const enrollmentId = `${formData.enrollmentId.part1}-${formData.enrollmentId.part2}-${formData.enrollmentId.part3}`;
      
      const payload = {
        enrollmentId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        batch: formData.batch || null,
        semester: formData.semester || null,
        cgpa: formData.cgpa || null,
        isActive: editingStudent ? formData.isActive : true,
        createLoginAccount: !editingStudent && formData.createLoginAccount,
        username: formData.createLoginAccount ? enrollmentId : null,
        password: formData.createLoginAccount ? formData.password : null
      };

      const url = editingStudent
        ? `${API_BASE}/students/${editingStudent.id}`
        : `${API_BASE}/students`;

      const response = await fetch(url, {
        method: editingStudent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        setSubmitError(data.message || `Failed to save student: ${response.status} ${response.statusText}`);
        return;
      }

      setSubmitSuccess(editingStudent ? 'Student updated successfully' : 'Student created successfully');
      setTimeout(() => setSubmitSuccess(''), 3000);
      closeModal();
      fetchStudents();
    } catch (error) {
      console.error('Student save error:', error);
      setSubmitError(error.message || 'Network error. Please check if the backend server is running on http://localhost:5073');
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPasswordError('');

    if (!newPassword.trim()) {
      setResetPasswordError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setResetPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetPasswordError('Passwords do not match');
      return;
    }

    if (!studentToResetPassword) {
      setResetPasswordError('Student not found');
      return;
    }

    try {
      setResettingPassword(true);
      const token = localStorage.getItem('token');

      // If student doesn't have a login account, create one first
      if (!studentToResetPassword.userId || !studentToResetPassword.hasLoginAccount) {
        // Create login account via student update
        const updatePayload = {
          enrollmentId: studentToResetPassword.enrollmentId,
          fullName: studentToResetPassword.fullName,
          email: studentToResetPassword.email,
          phone: studentToResetPassword.phone || null,
          departmentId: studentToResetPassword.departmentId || null,
          batch: studentToResetPassword.batch || null,
          semester: studentToResetPassword.semester || null,
          cgpa: studentToResetPassword.cgpa || null,
          isActive: studentToResetPassword.isActive,
          createLoginAccount: true,
          username: studentToResetPassword.enrollmentId,
          password: newPassword
        };

        const updateResponse = await fetch(`${API_BASE}/students/${studentToResetPassword.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok || !updateData) {
          throw new Error(updateData?.message || 'Failed to create login account');
        }

        setSubmitSuccess('Login account created and password set successfully');
        setTimeout(() => setSubmitSuccess(''), 3000);
        setIsResetPasswordModalOpen(false);
        setStudentToResetPassword(null);
        setNewPassword('');
        setConfirmPassword('');
        setResetPasswordError('');
        fetchStudents();
        return;
      }

      // Student has login account, reset password
      const response = await fetch(`${API_BASE}/auth/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: studentToResetPassword.userId,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSubmitSuccess('Password reset successfully');
      setTimeout(() => setSubmitSuccess(''), 3000);
      setIsResetPasswordModalOpen(false);
      setStudentToResetPassword(null);
      setNewPassword('');
      setConfirmPassword('');
      setResetPasswordError('');
      fetchStudents();
    } catch (error) {
      setResetPasswordError(error.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students/${studentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (response.ok) {
        setSubmitSuccess('Student deleted successfully');
        setTimeout(() => setSubmitSuccess(''), 3000);
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
        fetchStudents();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete student');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      setError('Failed to delete student');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  // Export students
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/students/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Students_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE}/students/template`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Students_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template failed:', error);
    }
  };

  // Import students
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/students/import`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success || result.importedCount > 0) {
        fetchStudents();
      }
    } catch (error) {
      setImportResult({ success: false, errors: ['Failed to import file'] });
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // Get unique batches for filter
  const batches = [...new Set(students.map(s => s.batch).filter(Boolean))];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500 mt-1">Manage student records and accounts</p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">{submitSuccess}</span>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`p-4 rounded-xl border ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${importResult.success ? 'text-green-700' : 'text-amber-700'}`}>
                  Import completed: {importResult.importedCount} imported, {importResult.failedCount} failed
                </p>
                {importResult.errors?.length > 0 && (
                  <ul className="mt-2 text-sm text-amber-600 list-disc list-inside">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>...and {importResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                )}
              </div>
              <button onClick={() => setImportResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filters & Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <select
                value={batchFilter}
                onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Batches</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Import/Export Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                title="Download Template"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Template</span>
              </button>
              <label className={`inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm cursor-pointer ${importLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">{importLoading ? 'Importing...' : 'Import'}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importLoading}
                />
              </label>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Academic Info</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500">Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">No students found</p>
                          <p className="text-gray-500 text-sm">Add a new student to get started</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{student.fullName}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px]">{student.email}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono font-medium">
                          {student.enrollmentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {student.departmentName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{student.departmentName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="space-y-1 text-sm">
                          {student.batch && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>Batch: {student.batch}</span>
                            </div>
                          )}
                          {student.cgpa && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Award className="w-3.5 h-3.5 text-gray-400" />
                              <span>CGPA: {student.cgpa}</span>
                            </div>
                          )}
                          {!student.batch && !student.cgpa && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setStudentToResetPassword(student);
                              setIsResetPasswordModalOpen(true);
                              setNewPassword('');
                              setConfirmPassword('');
                              setResetPasswordError('');
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(student)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setStudentToDelete(student); setIsDeleteModalOpen(true); }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} students
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Enrollment ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enrollment ID <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    id="enrollment-part1"
                    value={formData.enrollmentId.part1}
                    onChange={(e) => handleEnrollmentChange('part1', e.target.value)}
                    placeholder="01"
                    maxLength={2}
                    className={`w-14 h-12 border rounded-xl text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      formErrors.enrollmentId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  <span className="text-gray-300 font-medium text-lg">-</span>
                  <input
                    type="text"
                    id="enrollment-part2"
                    value={formData.enrollmentId.part2}
                    onChange={(e) => handleEnrollmentChange('part2', e.target.value)}
                    placeholder="131232"
                    maxLength={6}
                    className={`flex-1 h-12 border rounded-xl text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      formErrors.enrollmentId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  <span className="text-gray-300 font-medium text-lg">-</span>
                  <input
                    type="text"
                    id="enrollment-part3"
                    value={formData.enrollmentId.part3}
                    onChange={(e) => handleEnrollmentChange('part3', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                    className={`w-16 h-12 border rounded-xl text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      formErrors.enrollmentId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                </div>
                {formErrors.enrollmentId && <p className="mt-1 text-xs text-red-600">{formErrors.enrollmentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g., John Doe"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    formErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {formErrors.fullName && <p className="mt-1 text-xs text-red-600">{formErrors.fullName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@university.edu"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92-300-1234567"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="">No Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch</label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g., 2021"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    placeholder="e.g., Fall 2024"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CGPA</label>
                  <input
                    type="text"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    placeholder="e.g., 3.5"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Login Account Section - Only show when creating new student */}
              {!editingStudent && (
                <>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <input
                      type="checkbox"
                      id="createLoginAccount"
                      checked={formData.createLoginAccount}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        createLoginAccount: e.target.checked, 
                        username: e.target.checked ? formData.enrollmentId : '', 
                        password: '' 
                      })}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="createLoginAccount" className="text-sm font-medium text-gray-700">
                      Create login account for this student
                    </label>
                  </div>

                  {formData.createLoginAccount && (
                    <div className="space-y-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-sm font-medium text-indigo-900">Login Credentials</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Username (Enrollment ID)
                          </label>
                          <input
                            type="text"
                            value={
                              formData.enrollmentId.part1 && formData.enrollmentId.part2 && formData.enrollmentId.part3
                                ? `${formData.enrollmentId.part1}-${formData.enrollmentId.part2}-${formData.enrollmentId.part3}`
                                : 'Enter Enrollment ID first'
                            }
                            readOnly
                            className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs text-gray-500">Students log in using their Enrollment ID</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Minimum 6 characters"
                            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                              formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                          />
                          {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600">Student will use Enrollment ID + Password to log in</p>
                    </div>
                  )}
                </>
              )}

              {editingStudent && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Student is active
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  {editingStudent ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && studentToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsResetPasswordModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                  <p className="text-sm text-gray-500">{studentToResetPassword.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetPasswordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {resetPasswordError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setStudentToResetPassword(null);
                    setNewPassword('');
                    setConfirmPassword('');
                    setResetPasswordError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resettingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete <strong>{studentToDelete?.fullName}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStudents;


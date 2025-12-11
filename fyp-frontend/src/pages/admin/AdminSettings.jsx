import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  Bell,
  Shield,
  Key,
  Save,
  RefreshCw,
  CheckCircle,
  Plus,
  Trash2,
  Copy,
  XCircle,
  Clock,
  Mail,
  User,
  ExternalLink
} from 'lucide-react';

const API_BASE = 'http://localhost:5073/api';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    notifyNewUserRegistrations: false,
    notifyMissedLogs: true,
    notifyDeadlineReminders: true,
    notifyDefenseSchedule: true,
    notifyFundingUpdates: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // External tokens
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [newToken, setNewToken] = useState({ evaluatorName: '', evaluatorEmail: '', projectTitle: '', expiryHours: 48 });
  const [createdToken, setCreatedToken] = useState(null);
  const [tokenFilter, setTokenFilter] = useState('all');

  // Change password form
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    error: '',
    success: '',
    saving: false,
  });

  const tabs = [
    { id: 'password', label: 'Change Password', icon: Shield },
    { id: 'tokens', label: 'External Evaluator Tokens', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  // Load settings on mount
  useEffect(() => {
    loadNotificationSettings();
    loadTokens();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/systemsettings`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications({
          notifyNewUserRegistrations: data.notifyNewUserRegistrations ?? false,
          notifyMissedLogs: data.notifyMissedLogs ?? true,
          notifyDeadlineReminders: data.notifyDeadlineReminders ?? true,
          notifyDefenseSchedule: data.notifyDefenseSchedule ?? true,
          notifyFundingUpdates: data.notifyFundingUpdates ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setNotifSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/systemsettings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          ...notifications,
          // Include other required fields with defaults
          institutionName: 'Your Institution',
          academicYear: '2024-2025',
          enrollmentFormat: 'XX-XXXXXX-XXX',
          groupMinSize: 2,
          groupMaxSize: 3,
          maxUploadMB: 50,
          passwordMinLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          jwtExpiryHours: 24,
          externalTokenExpiryHours: 48,
          maxFailedLogins: 5,
          lockoutMinutes: 30,
          autoBackupEnabled: false,
          backupFrequency: 'weekly',
          backupRetentionDays: 30,
        }),
      });
      if (res.ok) {
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    } finally {
      setNotifSaving(false);
    }
  };

  const loadTokens = async () => {
    try {
      setTokensLoading(true);
      const token = localStorage.getItem('token');
      const status = tokenFilter !== 'all' ? `&status=${tokenFilter}` : '';
      const res = await fetch(`${API_BASE}/externaltokens?pageSize=100${status}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setTokensLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [tokenFilter]);

  const handleCreateToken = async () => {
    if (!newToken.evaluatorName || !newToken.evaluatorEmail) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/externaltokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(newToken),
      });
      if (res.ok) {
        const created = await res.json();
        setCreatedToken(created);
        setNewToken({ evaluatorName: '', evaluatorEmail: '', projectTitle: '', expiryHours: 48 });
        loadTokens();
      }
    } catch (err) {
      console.error('Failed to create token:', err);
    }
  };

  const handleRevokeToken = async (id) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/externaltokens/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      loadTokens();
    } catch (err) {
      console.error('Failed to revoke token:', err);
    }
  };

  const handleDeleteToken = async (id) => {
    if (!confirm('Are you sure you want to delete this token permanently?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/externaltokens/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      loadTokens();
    } catch (err) {
      console.error('Failed to delete token:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleChangePassword = async () => {
    // Validation
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdForm(p => ({ ...p, error: 'All password fields are required', success: '' }));
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdForm(p => ({ ...p, error: 'Password must be at least 8 characters', success: '' }));
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdForm(p => ({ ...p, error: 'Passwords do not match', success: '' }));
      return;
    }

    try {
      setPwdForm(p => ({ ...p, saving: true, error: '', success: '' }));
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword,
          confirmPassword: pwdForm.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to change password');
      }
      setPwdForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        error: '',
        success: 'Password changed successfully!',
        saving: false,
      });
    } catch (err) {
      setPwdForm(p => ({ ...p, saving: false, error: err.message || 'Failed to change password', success: '' }));
    }
  };

  const getTokenStatus = (token) => {
    if (token.isRevoked) return { label: 'Revoked', color: 'bg-red-100 text-red-700' };
    if (new Date(token.expiresAt) < new Date()) return { label: 'Expired', color: 'bg-gray-100 text-gray-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200">
            
            {/* Change Password */}
            {activeTab === 'password' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your account password</p>
                </div>

                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={pwdForm.currentPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={pwdForm.newPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={pwdForm.confirmPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  {pwdForm.error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {pwdForm.error}
                    </div>
                  )}

                  {pwdForm.success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {pwdForm.success}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={pwdForm.saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-all disabled:opacity-60 text-sm"
                  >
                    {pwdForm.saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    {pwdForm.saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}

            {/* External Evaluator Tokens */}
            {activeTab === 'tokens' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">External Evaluator Tokens</h2>
                    <p className="text-sm text-slate-500 mt-1">Generate secure access tokens for external evaluators</p>
                  </div>
                  <button
                    onClick={() => { setShowCreateToken(true); setCreatedToken(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Token
                  </button>
                </div>

                {/* Create Token Modal */}
                {showCreateToken && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-slate-900">Generate New Token</h3>
                    
                    {createdToken ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 font-medium mb-2">Token created successfully!</p>
                          <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-200">
                            <code className="text-xs flex-1 break-all">{createdToken.token}</code>
                            <button
                              onClick={() => copyToClipboard(createdToken.token)}
                              className="p-1.5 hover:bg-green-100 rounded"
                              title="Copy token"
                            >
                              <Copy className="w-4 h-4 text-green-600" />
                            </button>
                          </div>
                          <p className="text-xs text-green-600 mt-2">
                            Share this link with the evaluator: <br />
                            <code className="break-all">{`${window.location.origin}/evaluate?token=${createdToken.token}`}</code>
                          </p>
                        </div>
                        <button
                          onClick={() => { setShowCreateToken(false); setCreatedToken(null); }}
                          className="text-sm text-slate-600 hover:text-slate-900"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Evaluator Name *</label>
                            <input
                              type="text"
                              value={newToken.evaluatorName}
                              onChange={(e) => setNewToken({ ...newToken, evaluatorName: e.target.value })}
                              placeholder="Dr. John Smith"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Evaluator Email *</label>
                            <input
                              type="email"
                              value={newToken.evaluatorEmail}
                              onChange={(e) => setNewToken({ ...newToken, evaluatorEmail: e.target.value })}
                              placeholder="evaluator@email.com"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Project Title (Optional)</label>
                            <input
                              type="text"
                              value={newToken.projectTitle}
                              onChange={(e) => setNewToken({ ...newToken, projectTitle: e.target.value })}
                              placeholder="FYP Project Name"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Token Expiry (Hours)</label>
                            <input
                              type="number"
                              value={newToken.expiryHours}
                              onChange={(e) => setNewToken({ ...newToken, expiryHours: parseInt(e.target.value) || 48 })}
                              min="1"
                              max="168"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateToken}
                            disabled={!newToken.evaluatorName || !newToken.evaluatorEmail}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                          >
                            <Key className="w-4 h-4" />
                            Generate
                          </button>
                          <button
                            onClick={() => setShowCreateToken(false)}
                            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Filter */}
                <div className="flex gap-2">
                  {['all', 'active', 'expired', 'revoked'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTokenFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        tokenFilter === filter
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tokens List */}
                {tokensLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading tokens...</div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No tokens found</p>
                    <p className="text-sm text-slate-400">Generate a token for external evaluators</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tokens.map((token) => {
                      const status = getTokenStatus(token);
                      return (
                        <div key={token.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-900">{token.evaluatorName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {token.evaluatorEmail}
                                </span>
                                {token.projectTitle && (
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    {token.projectTitle}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Expires: {new Date(token.expiresAt).toLocaleString()}
                                </span>
                                {token.usedAt && (
                                  <span className="text-green-600">
                                    Used: {new Date(token.usedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyToClipboard(token.token)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
                                title="Copy token"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {!token.isRevoked && new Date(token.expiresAt) > new Date() && (
                                <button
                                  onClick={() => handleRevokeToken(token.id)}
                                  className="p-2 hover:bg-orange-50 rounded-lg text-orange-500 hover:text-orange-700"
                                  title="Revoke token"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteToken(token.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"
                                title="Delete token"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
                    <p className="text-sm text-slate-500 mt-1">Configure system notification preferences</p>
                  </div>
                  <button
                    onClick={saveNotificationSettings}
                    disabled={notifSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
                  >
                    {notifSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : notifSaved ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {notifSaving ? 'Saving...' : notifSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>

                <div className="space-y-3">
                  <ToggleItem
                    label="Email notifications for new user registrations"
                    description="Receive email when new users are added to the system"
                    checked={notifications.notifyNewUserRegistrations}
                    onToggle={(val) => setNotifications({ ...notifications, notifyNewUserRegistrations: val })}
                  />
                  <ToggleItem
                    label="Alert HOD on missed progress logs"
                    description="Auto-alert when 2 consecutive logs are missed by a group"
                    checked={notifications.notifyMissedLogs}
                    onToggle={(val) => setNotifications({ ...notifications, notifyMissedLogs: val })}
                  />
                  <ToggleItem
                    label="Deadline reminders"
                    description="Send reminders 7 days, 3 days, and 1 day before deadlines"
                    checked={notifications.notifyDeadlineReminders}
                    onToggle={(val) => setNotifications({ ...notifications, notifyDeadlineReminders: val })}
                  />
                  <ToggleItem
                    label="Defense schedule notifications"
                    description="Notify students and evaluators about scheduled defenses"
                    checked={notifications.notifyDefenseSchedule}
                    onToggle={(val) => setNotifications({ ...notifications, notifyDefenseSchedule: val })}
                  />
                  <ToggleItem
                    label="Funding approval updates"
                    description="Notify students on funding request status changes"
                    checked={notifications.notifyFundingUpdates}
                    onToggle={(val) => setNotifications({ ...notifications, notifyFundingUpdates: val })}
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-400">
                    Note: Email notifications require SMTP configuration. Contact system administrator to enable email delivery.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Toggle Component
const ToggleItem = ({ label, description, checked, onToggle }) => {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onToggle && onToggle(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export default AdminSettings;

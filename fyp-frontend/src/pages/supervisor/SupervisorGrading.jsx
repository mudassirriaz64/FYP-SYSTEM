import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Award,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  User,
  Calculator
} from 'lucide-react';
import api, { API_BASE } from '../../utils/api';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';

const SupervisorGrading = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedGroupId = searchParams.get('groupId');

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [marks, setMarks] = useState({});

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (preSelectedGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === parseInt(preSelectedGroupId));
      if (group) {
        handleSelectGroup(group);
      }
    }
  }, [preSelectedGroupId, groups]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_BASE}/supervisor/groups`);
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    
    // Initialize marks for each member
    const initialMarks = {};
    group.members?.forEach(member => {
      initialMarks[member.id] = {
        supervisorMarks: member.supervisorMarks || '',
        attendance: member.attendance || '',
        participation: member.participation || '',
        technicalSkills: member.technicalSkills || '',
        communication: member.communication || '',
        remarks: member.remarks || ''
      };
    });
    setMarks(initialMarks);
    setMembers(group.members || []);
  };

  const handleMarksChange = (memberId, field, value) => {
    // Validate marks (0-100)
    if (field !== 'remarks') {
      const numValue = parseFloat(value);
      if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
        return;
      }
    }
    
    setMarks(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }));
  };

  const calculateTotalMarks = (memberId) => {
    const memberMarks = marks[memberId];
    if (!memberMarks) return 0;
    
    const attendance = parseFloat(memberMarks.attendance) || 0;
    const participation = parseFloat(memberMarks.participation) || 0;
    const technical = parseFloat(memberMarks.technicalSkills) || 0;
    const communication = parseFloat(memberMarks.communication) || 0;
    
    // Weighted average: 20% each + 20% bonus potential
    const total = (attendance * 0.2) + (participation * 0.25) + (technical * 0.35) + (communication * 0.2);
    return Math.round(total * 10) / 10;
  };

  const handleSave = async () => {
    if (!selectedGroup) return;

    try {
      setSaving(true);
      setError('');

      const marksData = Object.entries(marks).map(([memberId, memberMarks]) => ({
        memberId: parseInt(memberId),
        supervisorMarks: calculateTotalMarks(memberId),
        breakdown: {
          attendance: parseFloat(memberMarks.attendance) || 0,
          participation: parseFloat(memberMarks.participation) || 0,
          technicalSkills: parseFloat(memberMarks.technicalSkills) || 0,
          communication: parseFloat(memberMarks.communication) || 0
        },
        remarks: memberMarks.remarks
      }));

      const response = await api.post(`${API_BASE}/supervisor/groups/${selectedGroup.id}/marks`, {
        marks: marksData
      });

      if (response.ok) {
        setSuccess('Marks saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save marks');
      }
    } catch (err) {
      setError('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supervisor/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Grading</h1>
            <p className="text-gray-500 mt-1">Evaluate and grade your supervised students</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')}><X className="h-4 w-4 text-red-600" /></button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess('')}><X className="h-4 w-4 text-green-600" /></button>
          </div>
        )}

        {/* Group Selection */}
        {!selectedGroup && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Group to Grade</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{group.groupName}</h3>
                        <p className="text-sm text-gray-500">{group.projectTitle || 'No title'}</p>
                        <span className="text-xs text-amber-600">{group.memberCount} members</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups to Grade</h3>
                <p className="text-gray-500">You don't have any assigned groups yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Grading Form */}
        {selectedGroup && (
          <div className="space-y-6">
            {/* Selected Group Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">{selectedGroup.groupName}</h3>
                    <p className="text-sm text-amber-700">{selectedGroup.projectTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Change Group
                </button>
              </div>
            </div>

            {/* Grading Criteria Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">Grading Criteria (Supervisor Marks - Total: 100)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-blue-700">
                  <p className="font-medium">Attendance</p>
                  <p className="text-blue-600">20%</p>
                </div>
                <div className="text-blue-700">
                  <p className="font-medium">Participation</p>
                  <p className="text-blue-600">25%</p>
                </div>
                <div className="text-blue-700">
                  <p className="font-medium">Technical Skills</p>
                  <p className="text-blue-600">35%</p>
                </div>
                <div className="text-blue-700">
                  <p className="font-medium">Communication</p>
                  <p className="text-blue-600">20%</p>
                </div>
              </div>
            </div>

            {/* Student Grades */}
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{member.studentName}</h3>
                        {member.isGroupManager && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Lead</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.enrollmentId}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                          {calculateTotalMarks(member.id)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Total Marks</p>
                    </div>
                  </div>

                  {/* Marks Input */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Attendance (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marks[member.id]?.attendance || ''}
                        onChange={(e) => handleMarksChange(member.id, 'attendance', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-center"
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Participation (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marks[member.id]?.participation || ''}
                        onChange={(e) => handleMarksChange(member.id, 'participation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-center"
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Technical Skills (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marks[member.id]?.technicalSkills || ''}
                        onChange={(e) => handleMarksChange(member.id, 'technicalSkills', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-center"
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Communication (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marks[member.id]?.communication || ''}
                        onChange={(e) => handleMarksChange(member.id, 'communication', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-center"
                        placeholder="0-100"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Remarks (Optional)
                    </label>
                    <textarea
                      value={marks[member.id]?.remarks || ''}
                      onChange={(e) => handleMarksChange(member.id, 'remarks', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="Any additional comments about this student..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate('/supervisor/groups')}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Marks
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </SupervisorLayout>
  );
};

export default SupervisorGrading;


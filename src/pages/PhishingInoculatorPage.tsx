/**
 * Phishing Inoculator Page - Main dashboard for family cybersecurity training
 * 
 * This component provides:
 * - Active phishing drills management
 * - Drill creator interface
 * - Family security scorecard
 * - Training history and analytics
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { PhishingDrill, FamilyMember, SecurityScore, DrillStatus } from '@/lib/apiTypes';

export const PhishingInoculatorPage = () => {
  const { user } = useAuth();
  const [drills, setDrills] = useState<PhishingDrill[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load active drills
      const drillsRes = await api.get<PhishingDrill[]>('/api/inoculator/drills');
      if (drillsRes.ok) {
        setDrills(drillsRes.data);
      }

      // Load family members
      const membersRes = await api.get<FamilyMember[]>('/api/families/members');
      if (membersRes.ok) {
        setFamilyMembers(membersRes.data);
      }

      // Load security score
      const scoreRes = await api.get<SecurityScore>('/api/inoculator/security-score');
      if (scoreRes.ok) {
        setSecurityScore(scoreRes.data);
      }

    } catch (err) {
      setError('Failed to load inoculator data. Please try again.');
      console.error('Inoculator data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDrill = async (drillData: DrillFormData) => {
    const res = await api.post<PhishingDrill>('/api/inoculator/drills', drillData);
    if (res.ok) {
      setDrills([...drills, res.data]);
      setShowCreator(false);
    } else {
      alert(res.error?.explanation_for_humans || 'Failed to create drill');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Phishing Inoculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🛡️ Family Phishing Inoculator
        </h1>
        <p className="text-lg text-gray-600">
          Train your family to spot phishing attacks before they happen
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Security Score Card */}
      {securityScore && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Family Security Score
              </h2>
              <p className="text-gray-600">
                Your family is {securityScore.percentage}% protected
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">
                {securityScore.score}
                <span className="text-3xl text-gray-400">/100</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{securityScore.drills_completed}</div>
              <div className="text-sm text-gray-600">Drills Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{securityScore.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{securityScore.needs_training}</div>
              <div className="text-sm text-gray-600">Needs Training</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Drills Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Drills</h2>
          <button
            onClick={() => setShowCreator(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Create New Drill
          </button>
        </div>

        {drills.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No active drills yet</p>
            <button
              onClick={() => setShowCreator(true)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Create your first phishing drill →
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drills.map((drill) => (
              <DrillCard key={drill.id} drill={drill} onRefresh={loadData} />
            ))}
          </div>
        )}
      </section>

      {/* Drill Creator Modal */}
      {showCreator && (
        <DrillCreator
          familyMembers={familyMembers}
          onSubmit={handleCreateDrill}
          onCancel={() => setShowCreator(false)}
        />
      )}
    </div>
  );
};

/**
 * Individual Drill Card Component
 */
interface DrillCardProps {
  drill: PhishingDrill;
  onRefresh?: () => void;
}

const DrillCard = ({ drill }: DrillCardProps) => {
  const statusColors: Record<DrillStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusIcons: Record<DrillStatus, string> = {
    pending: '⏳',
    active: '🎯',
    completed: '✅',
    failed: '⚠️',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-gray-900">{drill.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[drill.status]}`}>
          {statusIcons[drill.status]} {drill.status}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{drill.description}</p>
      
      <div className="text-xs text-gray-500 mb-3">
        <div>Target: {drill.target_member_name}</div>
        <div>Type: {drill.threat_type}</div>
        <div>Scheduled: {new Date(drill.scheduled_for).toLocaleDateString()}</div>
      </div>

      <button
        onClick={() => window.location.href = `/inoculator/drills/${drill.id}`}
        className="text-green-600 hover:text-green-700 text-sm font-medium"
      >
        View Details →
      </button>
    </div>
  );
};

/**
 * Drill Creator Component
 */
interface DrillFormData {
  target_user_id: string;
  threat_type: string;
  context: {
    shopping_sites: string[];
    interests: string[];
    family_structure: string;
  };
  scheduled_for: string;
}

interface DrillCreatorProps {
  familyMembers: FamilyMember[];
  onSubmit: (data: DrillFormData) => void;
  onCancel: () => void;
}

const DrillCreator = ({ familyMembers, onSubmit, onCancel }: DrillCreatorProps) => {
  const [formData, setFormData] = useState({
    target_user_id: '',
    threat_type: 'email_phishing',
    context: {
      shopping_sites: [] as string[],
      interests: [] as string[],
      family_structure: '',
    },
    scheduled_for: new Date().toISOString().slice(0, 16),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create Phishing Drill
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Target Member */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Family Member
            </label>
            <select
              required
              value={formData.target_user_id}
              onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select member...</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Threat Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drill Type
            </label>
            <select
              value={formData.threat_type}
              onChange={(e) => setFormData({ ...formData, threat_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="email_phishing">Email Phishing</option>
              <option value="sms_smishing">SMS Phishing (Smishing)</option>
              <option value="voice_vishing">Voice Call Scam (Vishing)</option>
              <option value="fake_delivery">Fake Package Delivery</option>
              <option value="fake_support">Fake Tech Support</option>
            </select>
          </div>

          {/* Schedule */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule For
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Context (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context (helps personalize the drill)
            </label>
            <input
              type="text"
              placeholder="e.g., shops at Target, has kids, likes gardening"
              onChange={(e) => {
                const interests = e.target.value.split(',').map(s => s.trim());
                setFormData({ 
                  ...formData, 
                  context: { ...formData.context, interests } 
                });
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated. This information stays private and is only used to create realistic simulations.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Drill
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhishingInoculatorPage;

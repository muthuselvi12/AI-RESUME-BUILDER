import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '18px',
      animation: 'fadeIn 0.4s ease forwards',
      opacity: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{icon}</div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{value ?? 0}</p>
      <p style={{ fontSize: '11px', color: '#10b981' }}>📈 {sub}</p>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onRoleChange, onDelete, isCurrentUser }) {
  const [loading, setLoading] = useState(false);
  const [hover,   setHover]   = useState(false);

  const roleColors = {
    admin: { bg: '#fef3c7', color: '#92400e' },
    user:  { bg: 'var(--primary-light)', color: 'var(--primary)' },
  };
  const rc = roleColors[user.role] || roleColors.user;

  const handleToggleRole = async () => {
    setLoading(true);
    await onRoleChange(user._id, user.role);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete user "${user.name}" and all their data?`)) return;
    setLoading(true);
    await onDelete(user._id);
    setLoading(false);
  };

  return (
    <tr
      style={{ background: hover ? 'var(--bg2)' : 'transparent', transition: 'background 0.15s' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* User info */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: user.role === 'admin' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {user.name}
              {isCurrentUser && (
                <span style={{ fontSize: '9px', background: '#059669', color: '#fff', padding: '1px 6px', borderRadius: '20px', fontWeight: 600 }}>YOU</span>
              )}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role badge */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: rc.bg, color: rc.color, textTransform: 'capitalize' }}>
          {user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
        </span>
      </td>

      {/* Resumes count */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
        {user.resumesCreated ?? 0}
      </td>

      {/* Chats count */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
        {user.chatsCount ?? 0}
      </td>

      {/* Joined date */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text3)' }}>
        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>

      {/* Last active */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text3)' }}>
        {user.lastActive
          ? new Date(user.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—'}
      </td>

      {/* Actions */}
      <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleToggleRole}
            disabled={loading || isCurrentUser}
            title={isCurrentUser ? 'Cannot change your own role' : `Change to ${user.role === 'admin' ? 'user' : 'admin'}`}
            style={{
              padding: '5px 10px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'var(--bg2)',
              cursor: loading || isCurrentUser ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              color: 'var(--text)',
              fontWeight: 500,
              opacity: isCurrentUser ? 0.4 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : user.role === 'admin' ? '→ User' : '→ Admin'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || isCurrentUser}
            title={isCurrentUser ? 'Cannot delete your own account' : 'Delete user'}
            style={{
              padding: '5px 8px',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              background: '#fef2f2',
              cursor: loading || isCurrentUser ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              color: '#dc2626',
              opacity: isCurrentUser ? 0.4 : 1,
            }}
          >
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [users,     setUsers]     = useState([]);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('all');
  const [loading,   setLoading]   = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setCurrentUserId(JSON.parse(storedUser).id); } catch {}
    }

    Promise.all([adminService.getDashboard(), adminService.getUsers()])
      .then(([d, u]) => {
        setDashboard(d.data.dashboard);
        setUsers(u.data.users || []);
      })
      .catch(() => toast('Failed to load admin data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Toggle user role
  const handleRoleChange = useCallback(async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminService.updateUserRole(id, newRole);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
      toast(`Role updated to ${newRole}`);
    } catch (err) {
      toast(err.response?.data?.error || 'Role update failed', 'error');
    }
  }, []);

  // Delete user
  const handleDelete = useCallback(async (id) => {
    try {
      await adminService.deleteUser(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast('User and all their data deleted');
    } catch (err) {
      toast(err.response?.data?.error || 'Delete failed', 'error');
    }
  }, []);

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const tabBtn = (active) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600,
    background: active ? 'var(--primary)' : 'var(--bg2)',
    color: active ? '#fff' : 'var(--text2)',
    transition: 'all 0.15s',
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
        <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🛡️ Admin Panel
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
          Manage users, monitor platform usage, and control access
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={tabBtn(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button style={tabBtn(activeTab === 'users')}   onClick={() => setActiveTab('users')}>👥 Users ({users.length})</button>
        <button style={tabBtn(activeTab === 'activity')} onClick={() => setActiveTab('activity')}>🕐 Activity</button>
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <StatCard label="Total Users"    value={dashboard?.totals?.users}   icon="👥" color="#6366f1" sub={`+${dashboard?.thisWeek?.users || 0} this week`} />
            <StatCard label="Total Resumes"  value={dashboard?.totals?.resumes} icon="📄" color="#059669" sub={`+${dashboard?.thisWeek?.resumes || 0} this week`} />
            <StatCard label="Chat Sessions"  value={dashboard?.totals?.chats}   icon="💬" color="#0891b2" sub="All time" />
            <StatCard label="Admin Users"    value={users.filter(u => u.role === 'admin').length} icon="🛡️" color="#7c3aed" sub="Platform admins" />
          </div>

          {/* Two column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Recent users */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                👤 Recent Users
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dashboard?.recentUsers?.slice(0, 5).map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'var(--bg2)' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: u.role === 'admin' ? '#f59e0b' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text3)' }}>{u.email}</p>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '20px', background: u.role === 'admin' ? '#fef3c7' : 'var(--primary-light)', color: u.role === 'admin' ? '#92400e' : 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>
                      {u.role}
                    </span>
                  </div>
                ))}
                {!dashboard?.recentUsers?.length && (
                  <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No users yet</p>
                )}
              </div>
            </div>

            {/* Recent resumes */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📄 Recent Resumes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dashboard?.recentResumes?.slice(0, 5).map(r => (
                  <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'var(--bg2)' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text3)' }}>
                        {r.userId?.name || 'Unknown'} · {r.template}
                      </p>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
                {!dashboard?.recentResumes?.length && (
                  <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No resumes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ USERS TAB ══ */}
      {activeTab === 'users' && (
        <div>
          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
              <span style={{ color: 'var(--text3)' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{ flex: 1, border: 'none', background: 'none', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '16px', padding: 0 }}>✕</button>
              )}
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>
          </div>

          {/* Results count */}
          {(search || roleFilter !== 'all') && (
            <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px' }}>
              Showing {filteredUsers.length} of {users.length} users
            </p>
          )}

          {/* Users table */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
                    {['User', 'Role', 'Resumes', 'Chats', 'Joined', 'Last Active', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: 'var(--text2)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '13px' }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <UserRow
                        key={u._id}
                        user={u}
                        onRoleChange={handleRoleChange}
                        onDelete={handleDelete}
                        isCurrentUser={u._id === currentUserId}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text3)' }}>
            <span>👥 Total: <strong style={{ color: 'var(--text)' }}>{users.length}</strong></span>
            <span>🛡️ Admins: <strong style={{ color: 'var(--text)' }}>{users.filter(u => u.role === 'admin').length}</strong></span>
            <span>👤 Users: <strong style={{ color: 'var(--text)' }}>{users.filter(u => u.role === 'user').length}</strong></span>
          </div>
        </div>
      )}

      {/* ══ ACTIVITY TAB ══ */}
      {activeTab === 'activity' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'New Users This Week',   value: dashboard?.thisWeek?.users   || 0, icon: '👥', color: '#6366f1' },
              { label: 'New Resumes This Week', value: dashboard?.thisWeek?.resumes || 0, icon: '📄', color: '#059669' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 500 }}>{s.label}</p>
                  <span style={{ fontSize: '22px' }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: '30px', fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Top users by resumes */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>
              🏆 Most Active Users
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)' }}>
                    {['#', 'User', 'Email', 'Resumes', 'Chats', 'Role'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text2)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...users]
                    .sort((a, b) => (b.resumesCreated || 0) - (a.resumesCreated || 0))
                    .slice(0, 10)
                    .map((u, i) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text3)', fontWeight: 600 }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500, color: 'var(--text)' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: '12px' }}>{u.email}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#6366f1' }}>{u.resumesCreated || 0}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#059669' }}>{u.chatsCount || 0}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: u.role === 'admin' ? '#fef3c7' : 'var(--primary-light)', color: u.role === 'admin' ? '#92400e' : 'var(--primary)', textTransform: 'capitalize' }}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
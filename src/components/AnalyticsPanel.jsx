import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { generateHourlyStats, generateWeeklyStats, ZONE_COLORS } from '../data/cameraData';
import { TrendingUp, Activity, AlertTriangle, Video } from 'lucide-react';

const CHART_COLORS = {
  motion: '#3b82f6',
  alerts: '#ef4444',
  people: '#10b981',
  bandwidth: '#8b5cf6',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-slate-400 mb-1.5 font-mono">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-bold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="glass-card p-4 flex items-start gap-3">
    <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: color + '20' }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`text-xs font-bold mt-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const AnalyticsPanel = ({ cameras, alerts }) => {
  const hourly = React.useMemo(() => generateHourlyStats(), []);
  const weekly = React.useMemo(() => generateWeeklyStats(), []);

  // Zone distribution
  const zoneDist = Object.entries(
    cameras.reduce((acc, cam) => {
      acc[cam.zone] = (acc[cam.zone] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace('Zone ', 'Z'), value, fullName: name }));

  const zoneColors = zoneDist.map(z =>
    ZONE_COLORS[z.fullName] || '#64748b'
  );

  const totalMotion = hourly.reduce((s, h) => s + h.motionEvents, 0);
  const totalAlerts = hourly.reduce((s, h) => s + h.alerts, 0);
  const avgPeople = Math.round(hourly.reduce((s, h) => s + h.peopleCount, 0) / hourly.length);
  const avgBandwidth = Math.round(hourly.reduce((s, h) => s + h.bandwidth, 0) / hourly.length);

  return (
    <div className="flex flex-col gap-5 overflow-y-auto pb-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          label="Motion Events (24h)"
          value={totalMotion.toLocaleString()}
          sub="Across all cameras"
          color="#3b82f6"
          trend={12}
        />
        <StatCard
          icon={AlertTriangle}
          label="Alerts Triggered"
          value={totalAlerts}
          sub="Last 24 hours"
          color="#ef4444"
          trend={-5}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. People Count"
          value={avgPeople}
          sub="Per hour peak"
          color="#10b981"
          trend={8}
        />
        <StatCard
          icon={Video}
          label="Bandwidth Usage"
          value={`${avgBandwidth} Mbps`}
          sub="Average throughput"
          color="#8b5cf6"
          trend={2}
        />
      </div>

      {/* Motion events chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-blue-400" />
          Motion Events & Alerts — Last 24 Hours
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="motionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} interval={3} />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="motionEvents" stroke="#3b82f6" strokeWidth={2}
              fill="url(#motionGrad)" name="Motion" dot={false} />
            <Area type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2}
              fill="url(#alertGrad)" name="Alerts" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* People count & bandwidth */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">People Count Over 24h</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={hourly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} interval={5} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="peopleCount" stroke="#10b981" strokeWidth={2}
                dot={false} name="People" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Bandwidth Usage (Mbps)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={hourly.slice(-12)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bandwidth" stroke="#8b5cf6" strokeWidth={2}
                fill="url(#bwGrad)" name="Mbps" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly incidents + Zone distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Weekly Incidents</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="incidents" fill="#ef4444" opacity={0.8} radius={[4, 4, 0, 0]} name="Incidents" />
              <Bar dataKey="resolved" fill="#10b981" opacity={0.8} radius={[4, 4, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Camera Zone Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={zoneDist}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {zoneDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={zoneColors[index]} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} contentStyle={{
                background: '#0f172a', border: '1px solid #334155',
                borderRadius: '8px', fontSize: '11px', color: '#e2e8f0'
              }} />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '10px' }}>{value}</span>}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;

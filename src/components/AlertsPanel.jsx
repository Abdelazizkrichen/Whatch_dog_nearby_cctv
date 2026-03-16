import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, Bell, BellOff, XCircle,
  Clock, Camera, Zap, Eye, Shield, Users, Filter
} from 'lucide-react';
import { ALERT_TYPES, ALERT_SEVERITY } from '../data/cameraData';

const alertTypeConfig = {
  [ALERT_TYPES.MOTION]: { icon: Zap, label: 'Motion', color: '#3b82f6' },
  [ALERT_TYPES.INTRUSION]: { icon: Shield, label: 'Intrusion', color: '#ef4444' },
  [ALERT_TYPES.TAMPERING]: { icon: AlertTriangle, label: 'Tampering', color: '#f59e0b' },
  [ALERT_TYPES.OFFLINE]: { icon: BellOff, label: 'Offline', color: '#6b7280' },
  [ALERT_TYPES.OVERCROWD]: { icon: Users, label: 'Overcrowd', color: '#8b5cf6' },
  [ALERT_TYPES.FACE]: { icon: Eye, label: 'Face', color: '#06b6d4' },
};

const severityConfig = {
  [ALERT_SEVERITY.CRITICAL]: {
    label: 'Critical',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-l-red-500',
    dotColor: '#ef4444',
  },
  [ALERT_SEVERITY.WARNING]: {
    label: 'Warning',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-l-amber-500',
    dotColor: '#f59e0b',
  },
  [ALERT_SEVERITY.INFO]: {
    label: 'Info',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500',
    dotColor: '#3b82f6',
  },
};

const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

const AlertItem = ({ alert, onAcknowledge, onResolve }) => {
  const typeCfg = alertTypeConfig[alert.type] || alertTypeConfig[ALERT_TYPES.MOTION];
  const sevCfg = severityConfig[alert.severity] || severityConfig[ALERT_SEVERITY.INFO];
  const Icon = typeCfg.icon;

  return (
    <div className={`
      rounded-xl p-3.5 border-l-4 transition-all duration-200 animate-fadeInUp
      ${sevCfg.bgColor} ${sevCfg.borderColor}
      ${alert.resolved ? 'opacity-40' : 'hover:brightness-110'}
    `}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
          style={{ background: typeCfg.color + '22' }}>
          <Icon size={14} style={{ color: typeCfg.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold ${sevCfg.textColor}`}>{sevCfg.label.toUpperCase()}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: typeCfg.color + '22', color: typeCfg.color }}>
              {typeCfg.label}
            </span>
            {alert.acknowledged && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle size={10} /> Ack
              </span>
            )}
            {alert.resolved && (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle size={10} /> Resolved
              </span>
            )}
          </div>

          <p className="text-sm text-slate-200 leading-snug mb-1.5">{alert.message}</p>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Camera size={10} /> {alert.cameraName}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {formatTime(alert.timestamp)}
            </span>
            <span className="font-mono opacity-60">{alert.id}</span>
          </div>
        </div>

        {/* Actions */}
        {!alert.resolved && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {!alert.acknowledged && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-300 
                  hover:bg-blue-600/60 hover:text-white transition-all font-medium"
              >
                Ack
              </button>
            )}
            <button
              onClick={() => onResolve(alert.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-300 
                hover:bg-emerald-600/60 hover:text-white transition-all font-medium"
            >
              Resolve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertsPanel = ({ alerts, onAcknowledge, onResolve }) => {
  const [filter, setFilter] = useState('active');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = alerts.filter(a => {
    const matchStatus =
      filter === 'all' ? true :
      filter === 'active' ? !a.resolved :
      filter === 'critical' ? a.severity === ALERT_SEVERITY.CRITICAL && !a.resolved :
      filter === 'resolved' ? a.resolved : true;
    const matchSev =
      severityFilter === 'all' ? true :
      a.severity === severityFilter;
    return matchStatus && matchSev;
  });

  const criticalCount = alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL && !a.resolved).length;
  const warningCount = alerts.filter(a => a.severity === ALERT_SEVERITY.WARNING && !a.resolved).length;
  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Critical</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Warnings</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{unresolvedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Unresolved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-500" />
        {[
          { key: 'active', label: 'Active' },
          { key: 'critical', label: 'Critical' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'all', label: 'All' },
        ].map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === btn.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
            }`}
          >
            {btn.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {['all', ALERT_SEVERITY.CRITICAL, ALERT_SEVERITY.WARNING, ALERT_SEVERITY.INFO].map(sv => (
            <button
              key={sv}
              onClick={() => setSeverityFilter(sv)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                severityFilter === sv
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              {sv === 'all' ? 'All Sev.' : sv}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex flex-col gap-2 overflow-y-auto pb-4" style={{ maxHeight: 'calc(100vh - 340px)' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No alerts in this category</p>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;

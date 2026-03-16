import React, { useState } from 'react';
import {
  Shield, Camera, Map, Bell, BarChart2, Settings,
  Eye, Wifi, WifiOff, AlertTriangle, ChevronRight,
  Activity, Lock, Zap, Moon, RefreshCw, Menu, X,
  Video, Clock, Signal, Power
} from 'lucide-react';
import { useWatchdog } from './hooks/useWatchdog';
import CCTVMap from './components/CCTVMap';
import LiveFeedGrid from './components/LiveFeedGrid';
import AlertsPanel from './components/AlertsPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import CameraDetail from './components/CameraDetail';
import { CAMERA_STATUSES, ZONE_COLORS } from './data/cameraData';

// ─── Status Bar ──────────────────────────────────────────────────
const StatusBar = ({ systemStatus, activeAlertCount, watchdogActive, onToggleWatchdog, lastScan }) => {
  const items = [
    { label: 'Online', value: systemStatus.online, color: 'text-emerald-400', icon: Wifi },
    { label: 'Offline', value: systemStatus.offline, color: 'text-red-400', icon: WifiOff },
    { label: 'Warning', value: systemStatus.warning, color: 'text-amber-400', icon: AlertTriangle },
    { label: 'Recording', value: systemStatus.recording, color: 'text-blue-400', icon: Video },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <item.icon size={13} className={item.color} />
          <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          <span className="text-xs text-slate-600">{item.label}</span>
        </div>
      ))}

      <div className="flex-1" />

      {/* Alert badge */}
      {activeAlertCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
          <Bell size={12} className="text-red-400" />
          <span className="text-xs font-bold text-red-400">{activeAlertCount} Active Alerts</span>
        </div>
      )}

      {/* Last scan */}
      <div className="flex items-center gap-1 text-xs text-slate-600">
        <Clock size={11} />
        <span>Scan: {lastScan.toLocaleTimeString()}</span>
      </div>

      {/* Watchdog toggle */}
      <button
        onClick={onToggleWatchdog}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          watchdogActive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:bg-slate-700/60'
        }`}
      >
        <Power size={12} />
        Watchdog {watchdogActive ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────
const navItems = [
  { id: 'map', icon: Map, label: 'Live Map' },
  { id: 'feeds', icon: Camera, label: 'Camera Feeds' },
  { id: 'alerts', icon: Bell, label: 'Alerts', badge: true },
  { id: 'analytics', icon: BarChart2, label: 'Analytics' },
];

const Sidebar = ({ activeTab, onTabChange, activeAlertCount, collapsed, onToggleCollapse }) => (
  <aside className={`flex flex-col h-full border-r border-slate-800/60 bg-slate-900/80 backdrop-blur-xl
    transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
    {/* Logo */}
    <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800/60 ${collapsed ? 'justify-center px-2' : ''}`}>
      <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 flex-shrink-0">
        <Shield size={20} className="text-blue-400" />
      </div>
      {!collapsed && (
        <div>
          <h1 className="text-sm font-black text-white tracking-tight">WatchDog</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">CCTV Surveillance</p>
        </div>
      )}
    </div>

    {/* Nav */}
    <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
      {navItems.map(item => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              relative flex items-center gap-3 rounded-xl transition-all duration-200
              ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
              ${active
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }
            `}
            title={collapsed ? item.label : ''}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            {item.badge && activeAlertCount > 0 && (
              <span className={`
                ${collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto'}
                min-w-5 h-5 flex items-center justify-center
                rounded-full bg-red-500 text-[10px] font-bold text-white px-1
              `}>
                {activeAlertCount > 99 ? '99+' : activeAlertCount}
              </span>
            )}
            {active && !collapsed && (
              <ChevronRight size={14} className="ml-auto text-blue-400/60" />
            )}
          </button>
        );
      })}
    </nav>

    {/* Collapse button */}
    <div className="p-3 border-t border-slate-800/60">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
      >
        {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
      </button>
    </div>
  </aside>
);

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const {
    cameras, alerts, systemStatus, activeAlertCount,
    watchdogActive, lastScan,
    acknowledgeAlert, resolveAlert,
    toggleCamera, toggleWatchdog,
  } = useWatchdog();

  const [activeTab, setActiveTab] = useState('map');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleCameraSelect = (cam) => {
    setSelectedCamera(cam);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a] text-slate-200">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeAlertCount={activeAlertCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Status Bar */}
        <StatusBar
          systemStatus={systemStatus}
          activeAlertCount={activeAlertCount}
          watchdogActive={watchdogActive}
          onToggleWatchdog={toggleWatchdog}
          lastScan={lastScan}
        />

        {/* Page header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white">
              {activeTab === 'map' && '🗺️ Live Surveillance Map'}
              {activeTab === 'feeds' && '📹 Camera Feeds'}
              {activeTab === 'alerts' && '🚨 Alerts & Incidents'}
              {activeTab === 'analytics' && '📊 Analytics Dashboard'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {systemStatus.totalCameras} cameras · {systemStatus.online} online · {activeAlertCount} active alerts
            </p>
          </div>

          {/* Watchdog indicator */}
          <div className="flex items-center gap-2">
            {watchdogActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="pulse-dot pulse-dot-green" />
                <span className="text-xs font-semibold text-emerald-400">Watchdog Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex gap-0 px-4 pb-4">
          {/* Main panel */}
          <div className={`flex-1 overflow-hidden transition-all duration-300 ${selectedCamera ? 'mr-4' : ''}`}>
            {activeTab === 'map' && (
              <div className="h-full flex flex-col gap-4">
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/60" style={{ minHeight: '400px' }}>
                  <CCTVMap
                    cameras={cameras}
                    selectedCamera={selectedCamera}
                    onCameraSelect={handleCameraSelect}
                  />
                </div>
                {/* Map camera list */}
                <div className="glass-card p-4 flex-shrink-0" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Nearby Cameras</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...cameras].sort((a, b) => a.distance - b.distance).map(cam => (
                      <button
                        key={cam.id}
                        onClick={() => handleCameraSelect(cam)}
                        className={`
                          flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border
                          ${selectedCamera?.id === cam.id
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-800/50 border-slate-700/40 text-slate-400 hover:border-slate-500/60 hover:text-slate-200'
                          }
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cam.status === CAMERA_STATUSES.ONLINE ? 'bg-emerald-400' :
                          cam.status === CAMERA_STATUSES.OFFLINE ? 'bg-red-400' : 'bg-amber-400'
                        }`} />
                        {cam.name}
                        <span className="text-slate-600 font-normal">{cam.distance}km</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feeds' && (
              <div className="h-full overflow-hidden">
                <LiveFeedGrid
                  cameras={cameras}
                  onCameraSelect={handleCameraSelect}
                  selectedCamera={selectedCamera}
                  onToggleCamera={toggleCamera}
                />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="h-full overflow-y-auto">
                <AlertsPanel
                  alerts={alerts}
                  onAcknowledge={acknowledgeAlert}
                  onResolve={resolveAlert}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="h-full overflow-y-auto">
                <AnalyticsPanel cameras={cameras} alerts={alerts} />
              </div>
            )}
          </div>

          {/* Camera Detail Panel */}
          {selectedCamera && (
            <div className="w-80 flex-shrink-0 overflow-hidden rounded-xl border border-slate-800/60">
              <CameraDetail
                camera={selectedCamera}
                onClose={() => setSelectedCamera(null)}
                onToggle={toggleCamera}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

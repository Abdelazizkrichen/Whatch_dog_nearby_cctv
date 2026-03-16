import React, { useState } from 'react';
import {
  X, Camera, Wifi, WifiOff, AlertTriangle, Eye, Moon, Video,
  Settings, RefreshCw, MapPin, Shield, Clock, Cpu, Signal,
  Volume2, VolumeX, Maximize, RotateCcw, ZoomIn, ZoomOut
} from 'lucide-react';
import { CAMERA_STATUSES } from '../data/cameraData';

const StatusPill = ({ status }) => {
  const cfg = {
    [CAMERA_STATUSES.ONLINE]: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Online', dot: '#10b981' },
    [CAMERA_STATUSES.OFFLINE]: { color: 'text-red-400', bg: 'bg-red-500/15', label: 'Offline', dot: '#ef4444' },
    [CAMERA_STATUSES.WARNING]: { color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Warning', dot: '#f59e0b' },
  }[status] || { color: 'text-slate-400', bg: 'bg-slate-500/15', label: 'Unknown', dot: '#64748b' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.color} ${cfg.bg}`}>
      <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
    <span className="text-xs text-slate-500">{label}</span>
    <span className={`text-xs font-semibold ${highlight || 'text-slate-200'}`}>{value}</span>
  </div>
);

const CameraDetail = ({ camera, onClose, onToggle }) => {
  const [muted, setMuted] = useState(false);
  const [zoom, setZoom] = useState(1);

  if (!camera) return null;

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/15">
            <Camera size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{camera.name}</h2>
            <p className="text-xs text-slate-500">{camera.id} · {camera.zone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={camera.status} />
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Live Feed Preview (larger) */}
      <div className="relative bg-black flex-shrink-0" style={{ height: '220px' }}>
        <canvas
          id={`detail-canvas-${camera.id}`}
          className="w-full h-full"
          style={{ objectFit: 'cover' }}
        />
        <LiveFeedDetail camera={camera} zoom={zoom} />

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
          <button onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="p-1 text-slate-300 hover:text-white">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-mono text-slate-400">{zoom.toFixed(2)}×</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 text-slate-300 hover:text-white">
            <ZoomIn size={14} />
          </button>
          <div className="flex-1" />
          <button onClick={() => setMuted(m => !m)} className="p-1 text-slate-300 hover:text-white">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={() => onToggle(camera.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              camera.status === CAMERA_STATUSES.OFFLINE
                ? 'bg-emerald-600/60 text-emerald-200 hover:bg-emerald-600'
                : 'bg-red-600/40 text-red-200 hover:bg-red-600/60'
            }`}
          >
            {camera.status === CAMERA_STATUSES.OFFLINE ? 'Enable' : 'Disable'}
          </button>
        </div>
      </div>

      {/* Details scroll area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Technical Specs */}
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Specs</h4>
        <div className="mb-4">
          <InfoRow label="Brand / Model" value={camera.brand} />
          <InfoRow label="IP Address" value={camera.ip} highlight="text-cyan-400 font-mono" />
          <InfoRow label="Resolution" value={camera.resolution} />
          <InfoRow label="Frame Rate" value={`${camera.fps} FPS`} />
          <InfoRow label="View Angle" value={`${camera.angle}°`} />
          <InfoRow label="Night Vision" value={camera.nightVision ? 'Enabled' : 'Disabled'}
            highlight={camera.nightVision ? 'text-purple-400' : 'text-slate-400'} />
          <InfoRow label="Recording" value={camera.recording ? 'Active' : 'Stopped'}
            highlight={camera.recording ? 'text-emerald-400' : 'text-slate-500'} />
        </div>

        {/* Performance */}
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Performance</h4>
        <div className="mb-4">
          <InfoRow label="Uptime (30d)" value={camera.uptime}
            highlight={parseFloat(camera.uptime) > 95 ? 'text-emerald-400' : 'text-amber-400'} />
          <InfoRow label="Motion Sensitivity" value={`${camera.motionSensitivity}%`} />
          <InfoRow label="Last Motion" value={camera.lastMotion} />
          <InfoRow label="Distance from Hub" value={`${camera.distance} km`} />
        </div>

        {/* Deployment */}
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deployment</h4>
        <div className="mb-4">
          <InfoRow label="Install Date" value={camera.installDate} />
          <InfoRow label="Zone" value={camera.zone} />
          <InfoRow label="Coordinates" value={`${camera.lat.toFixed(4)}, ${camera.lng.toFixed(4)}`}
            highlight="text-cyan-400 font-mono text-[10px]" />
        </div>

        {/* Motion Sensitivity Bar */}
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sensitivity</h4>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Motion Threshold</span>
            <span className="text-xs font-bold text-blue-400">{camera.motionSensitivity}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${camera.motionSensitivity}%`,
                background: camera.motionSensitivity > 80 ? '#ef4444' : camera.motionSensitivity > 60 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>

        {/* Uptime bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">System Uptime</span>
            <span className="text-xs font-bold text-emerald-400">{camera.uptime}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: camera.uptime }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Live feed mini canvas for detail panel
const LiveFeedDetail = ({ camera, zoom }) => {
  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);
  const frameRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      frameRef.current++;
      const t = frameRef.current;

      if (camera.status === CAMERA_STATUSES.OFFLINE) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#2a2a2a';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO SIGNAL', w / 2, h / 2 - 10);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#444';
        ctx.fillText(camera.ip, w / 2, h / 2 + 14);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const isNight = Math.sin(Date.now() / 80000) > 0.5;
      const baseColor = camera.nightVision && isNight ? [0, 30, 0] : [8, 16, 30];

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgb(${baseColor[0]+10},${baseColor[1]+10},${baseColor[2]+10})`);
      grad.addColorStop(1, `rgb(${baseColor[0]},${baseColor[1]},${baseColor[2]})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Noise
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 25;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i+1] = Math.max(0, Math.min(255, d[i+1] + n * 0.5));
        d[i+2] = Math.max(0, Math.min(255, d[i+2] + n * 0.3));
      }
      ctx.putImageData(imgData, 0, 0);

      // Scanline
      const scanY = (t * 1.2) % h;
      const sg = ctx.createLinearGradient(0, scanY-6, 0, scanY+6);
      sg.addColorStop(0, 'rgba(0,255,128,0)');
      sg.addColorStop(0.5, 'rgba(0,255,128,0.1)');
      sg.addColorStop(1, 'rgba(0,255,128,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY-6, w, 12);

      // Crosshair when motion
      if (camera.motionSensitivity > 70 && Math.sin(t * 0.05) > 0.5) {
        const cx = w * 0.5 + Math.sin(t * 0.02) * w * 0.2;
        const cy = h * 0.5 + Math.cos(t * 0.015) * h * 0.2;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 6, cy);
        ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 16, cy);
        ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy - 6);
        ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy + 16);
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Grid overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += w / 3) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += h / 3) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Timestamp
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, h - 24, w, 24);
      ctx.fillStyle = camera.nightVision && isNight ? '#00ff80' : '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      const now = new Date();
      ctx.fillText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}  |  ${camera.id}`, 8, h - 8);

      if (camera.recording) {
        ctx.fillStyle = `rgba(239,68,68,${0.6 + 0.4 * Math.sin(t * 0.12)})`;
        ctx.beginPath();
        ctx.arc(w - 16, h - 13, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('REC', w - 24, h - 8);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [camera, zoom]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={220}
      style={{
        width: '100%', height: '100%',
        transform: `scale(${zoom})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease',
      }}
    />
  );
};

export default CameraDetail;

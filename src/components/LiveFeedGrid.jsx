import React, { useState, useEffect } from 'react';
import {
  Wifi, WifiOff, AlertTriangle, Video, VideoOff,
  Eye, Moon, Maximize2, Settings, RefreshCw
} from 'lucide-react';
import { CAMERA_STATUSES } from '../data/cameraData';

// Simulated camera feed with noise & scanline effect
const CameraFeedCanvas = ({ camera, width = '100%', height = '160px' }) => {
  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);
  const frameRef = React.useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      frameRef.current++;

      if (camera.status === CAMERA_STATUSES.OFFLINE) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO SIGNAL', w / 2, h / 2 - 8);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#555';
        ctx.fillText(camera.ip, w / 2, h / 2 + 12);
        return;
      }

      // Simulated night-vision / day scene
      const isNight = Math.sin(Date.now() / 80000) > 0.5;
      const baseColor = camera.nightVision && isNight ? [0, 40, 0] : [10, 20, 35];

      // Draw gradient background (simulates scene depth)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgba(${baseColor[0] + 8},${baseColor[1] + 8},${baseColor[2] + 8},1)`);
      grad.addColorStop(1, `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw noise grain
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.5));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.3));
      }
      ctx.putImageData(imageData, 0, 0);

      // Simulated moving elements
      const t = frameRef.current;
      if (camera.status === CAMERA_STATUSES.WARNING) {
        // Draw warning overlay
        ctx.fillStyle = `rgba(245, 158, 11, ${0.05 + 0.04 * Math.sin(t * 0.1)})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Simulated person silhouette
      if (camera.status !== CAMERA_STATUSES.OFFLINE && Math.sin(t * 0.02) > 0.3) {
        const px = (w * 0.3 + (w * 0.4 * (Math.sin(t * 0.015) + 1) / 2)) | 0;
        ctx.fillStyle = camera.nightVision && isNight
          ? 'rgba(0, 255, 80, 0.5)'
          : 'rgba(180, 200, 220, 0.4)';
        // body
        ctx.fillRect(px - 6, h * 0.4, 12, 28);
        // head
        ctx.beginPath();
        ctx.arc(px, h * 0.38, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scanline
      const scanY = (t * 1.5) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8);
      scanGrad.addColorStop(0, 'rgba(0,255,128,0)');
      scanGrad.addColorStop(0.5, 'rgba(0,255,128,0.12)');
      scanGrad.addColorStop(1, 'rgba(0,255,128,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 8, w, 16);

      // Timestamp overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, h - 22, w, 22);
      ctx.fillStyle = camera.nightVision && isNight ? '#00ff80' : '#a0aec0';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      const now = new Date();
      ctx.fillText(
        `${now.toLocaleDateString()} ${now.toLocaleTimeString()}  |  ${camera.id}`,
        6, h - 7
      );

      // REC dot
      if (camera.recording) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + 0.4 * Math.sin(t * 0.12)})`;
        ctx.beginPath();
        ctx.arc(w - 14, h - 13, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('REC', w - 20, h - 7);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [camera]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={160}
      style={{ width, height, display: 'block', imageRendering: 'pixelated' }}
    />
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    [CAMERA_STATUSES.ONLINE]: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Online', dot: 'pulse-dot-green' },
    [CAMERA_STATUSES.OFFLINE]: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Offline', dot: 'pulse-dot-red' },
    [CAMERA_STATUSES.WARNING]: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Warning', dot: 'pulse-dot-yellow' },
    [CAMERA_STATUSES.RECORDING]: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Recording', dot: 'pulse-dot-green' },
  };
  const cfg = configs[status] || configs[CAMERA_STATUSES.OFFLINE];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      <span className={`pulse-dot ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const CameraCard = ({ camera, onSelect, isSelected, onToggle }) => {
  return (
    <div
      className={`glass-card overflow-hidden cursor-pointer transition-all duration-200 animate-fadeInUp
        ${isSelected ? 'ring-2 ring-blue-500/70 shadow-lg shadow-blue-500/10' : 'hover:border-slate-500/80'}
      `}
      onClick={() => onSelect(camera)}
    >
      {/* Feed */}
      <div className="cctv-feed relative">
        <CameraFeedCanvas camera={camera} width="100%" height="160px" />
        {/* Overlay top bar */}
        <div className="absolute top-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
          <span className="text-[10px] font-mono text-slate-300">{camera.id}</span>
          <StatusBadge status={camera.status} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white truncate">{camera.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{camera.zone}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(camera.id); }}
            className={`p-1.5 rounded-lg transition-colors ${
              camera.status === CAMERA_STATUSES.OFFLINE
                ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={camera.status === CAMERA_STATUSES.OFFLINE ? 'Enable camera' : 'Disable camera'}
          >
            {camera.status === CAMERA_STATUSES.OFFLINE ? <VideoOff size={14} /> : <Video size={14} />}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-slate-800/50 rounded-lg p-1.5">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Res</p>
            <p className="text-[10px] font-bold text-slate-300">{camera.resolution}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-1.5">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">FPS</p>
            <p className="text-[10px] font-bold text-slate-300">{camera.fps}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-1.5">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Uptime</p>
            <p className="text-[10px] font-bold text-emerald-400">{camera.uptime}</p>
          </div>
        </div>

        {/* Last motion */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Eye size={9} /> Motion: {camera.lastMotion}
          </span>
          {camera.nightVision && (
            <span className="text-[10px] text-purple-400 flex items-center gap-1">
              <Moon size={9} /> NV
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const LiveFeedGrid = ({ cameras, onCameraSelect, selectedCamera, onToggleCamera }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gridCols, setGridCols] = useState('grid-cols-2 md:grid-cols-3 xl:grid-cols-4');

  const filtered = cameras.filter(cam => {
    const matchStatus = filter === 'all' || cam.status === filter;
    const matchSearch = cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.zone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filterBtns = [
    { key: 'all', label: 'All', count: cameras.length },
    { key: 'online', label: 'Online', count: cameras.filter(c => c.status === 'online').length },
    { key: 'offline', label: 'Offline', count: cameras.filter(c => c.status === 'offline').length },
    { key: 'warning', label: 'Warning', count: cameras.filter(c => c.status === 'warning').length },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search cameras..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-48 bg-slate-800/70 border border-slate-700/60 text-slate-200 placeholder-slate-500
            rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
        />
        <div className="flex items-center gap-1.5">
          {filterBtns.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === btn.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
              }`}
            >
              {btn.label} <span className="opacity-70">({btn.count})</span>
            </button>
          ))}
        </div>
        {/* Grid size toggle */}
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
          {[
            { label: '2×', value: 'grid-cols-2' },
            { label: '3×', value: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' },
            { label: '4×', value: 'grid-cols-2 md:grid-cols-4 xl:grid-cols-5' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setGridCols(opt.value)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                gridCols === opt.value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={`grid ${gridCols} gap-4 overflow-y-auto pb-4`} style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {filtered.map(cam => (
          <CameraCard
            key={cam.id}
            camera={cam}
            onSelect={onCameraSelect}
            isSelected={selectedCamera?.id === cam.id}
            onToggle={onToggleCamera}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500">
            <VideoOff size={40} className="mx-auto mb-3 opacity-40" />
            <p>No cameras match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeedGrid;

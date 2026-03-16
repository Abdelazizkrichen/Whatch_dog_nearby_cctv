import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMERA_STATUSES, ZONE_COLORS } from '../data/cameraData';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCameraIcon = (status, zone) => {
  const color =
    status === CAMERA_STATUSES.ONLINE ? '#10b981' :
    status === CAMERA_STATUSES.OFFLINE ? '#ef4444' :
    status === CAMERA_STATUSES.WARNING ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px; height:36px; 
        background:${color}22; 
        border: 2px solid ${color};
        border-radius:50%; 
        display:flex; 
        align-items:center; 
        justify-content:center;
        box-shadow: 0 0 12px ${color}66, 0 0 24px ${color}33;
        cursor:pointer;
        position:relative;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        ${status === CAMERA_STATUSES.ONLINE ? `
        <div style="
          position:absolute; top:-3px; right:-3px;
          width:9px; height:9px;
          background:#10b981; border-radius:50%;
          border:2px solid #0a0e1a;
        "></div>` : ''}
        ${status === CAMERA_STATUSES.WARNING ? `
        <div style="
          position:absolute; top:-3px; right:-3px;
          width:9px; height:9px;
          background:#f59e0b; border-radius:50%;
          border:2px solid #0a0e1a;
        "></div>` : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
};

const MapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1.2 });
  }, [center, map]);
  return null;
};

// Canvas fallback map for when tiles are unavailable
const CanvasFallbackMap = ({ cameras, selectedCamera, onCameraSelect }) => {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const toCanvas = (lat, lng, w, h) => {
    const minLat = 40.708, maxLat = 40.718;
    const minLng = -74.011, maxLng = -74.002;
    const x = ((lng - minLng) / (maxLng - minLng)) * w;
    const y = ((maxLat - lat) / (maxLat - minLat)) * h;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (city blocks)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw simulated roads
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const roads = [
      [[0, h * 0.3], [w, h * 0.3]],
      [[0, h * 0.6], [w, h * 0.6]],
      [[w * 0.25, 0], [w * 0.25, h]],
      [[w * 0.55, 0], [w * 0.55, h]],
      [[w * 0.8, 0], [w * 0.8, h]],
      [[0, h * 0.5], [w * 0.55, h * 0.5]],
    ];
    roads.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });

    // Road center lines
    ctx.strokeStyle = '#2d5a8e22';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    roads.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw zone coverage circles
    cameras.filter(c => c.status !== CAMERA_STATUSES.OFFLINE).forEach(cam => {
      const { x, y } = toCanvas(cam.lat, cam.lng, w, h);
      const zoneColor = ZONE_COLORS[cam.zone] || '#3b82f6';
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 50);
      grad.addColorStop(0, zoneColor + '18');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw cameras
    cameras.forEach(cam => {
      const { x, y } = toCanvas(cam.lat, cam.lng, w, h);
      const isSelected = selectedCamera?.id === cam.id;
      const isHovered = hovered === cam.id;
      const color =
        cam.status === CAMERA_STATUSES.ONLINE ? '#10b981' :
        cam.status === CAMERA_STATUSES.OFFLINE ? '#ef4444' : '#f59e0b';

      // Glow
      if (cam.status !== CAMERA_STATUSES.OFFLINE) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 24);
        glow.addColorStop(0, color + '40');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer ring (selected)
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Circle bg
      const r = isHovered || isSelected ? 16 : 14;
      ctx.fillStyle = color + '20';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Camera icon (simplified)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - 7, y - 4, 10, 8, 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 3, y - 3); ctx.lineTo(x + 8, y - 5);
      ctx.lineTo(x + 8, y + 5); ctx.lineTo(x + 3, y + 3);
      ctx.closePath();
      ctx.fill();

      // Label
      if (isSelected || isHovered) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        const labelW = 130;
        ctx.roundRect(x - labelW / 2, y - 40, labelW, 22, 4);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cam.name.slice(0, 18), x, y - 25);
        ctx.fillStyle = color;
        ctx.font = '9px monospace';
        ctx.fillText(cam.id, x, y - 14);
      }

      // ID label (always)
      ctx.fillStyle = '#475569';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cam.id, x, y + r + 10);
    });

    // Legend
    ctx.fillStyle = 'rgba(10,14,26,0.85)';
    ctx.roundRect(12, h - 95, 145, 80, 8);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.roundRect(12, h - 95, 145, 80, 8);
    ctx.stroke();

    const legend = [
      { color: '#10b981', label: 'Online' },
      { color: '#ef4444', label: 'Offline' },
      { color: '#f59e0b', label: 'Warning' },
    ];
    ctx.font = '10px Inter, sans-serif';
    legend.forEach((item, i) => {
      const ly = h - 78 + i * 22;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(26, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, 38, ly + 4);
    });

    // Scale bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(w - 80, h - 20, 60, 3);
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('500m', w - 50, h - 8);

  }, [cameras, selectedCamera, hovered]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const w = canvas.width;
    const h = canvas.height;

    const toCanvas = (lat, lng) => {
      const minLat = 40.708, maxLat = 40.718;
      const minLng = -74.011, maxLng = -74.002;
      return {
        x: ((lng - minLng) / (maxLng - minLng)) * w,
        y: ((maxLat - lat) / (maxLat - minLat)) * h
      };
    };

    for (const cam of cameras) {
      const { x, y } = toCanvas(cam.lat, cam.lng);
      if (Math.hypot(mx - x, my - y) < 18) {
        onCameraSelect(cam);
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const w = canvas.width;
    const h = canvas.height;

    const toCanvasLocal = (lat, lng) => {
      const minLat = 40.708, maxLat = 40.718;
      const minLng = -74.011, maxLng = -74.002;
      return {
        x: ((lng - minLng) / (maxLng - minLng)) * w,
        y: ((maxLat - lat) / (maxLat - minLat)) * h
      };
    };

    for (const cam of cameras) {
      const { x, y } = toCanvasLocal(cam.lat, cam.lng);
      if (Math.hypot(mx - x, my - y) < 18) {
        setHovered(cam.id);
        return;
      }
    }
    setHovered(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={480}
      style={{ width: '100%', height: '100%', cursor: 'crosshair', borderRadius: '10px' }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    />
  );
};

const CCTVMap = ({ cameras, selectedCamera, onCameraSelect }) => {
  const getStatusInfo = (status) => ({
    label: status === CAMERA_STATUSES.ONLINE ? 'Online' : status === CAMERA_STATUSES.OFFLINE ? 'Offline' : 'Warning',
    color: status === CAMERA_STATUSES.ONLINE ? '#10b981' : status === CAMERA_STATUSES.OFFLINE ? '#ef4444' : '#f59e0b',
  });

  return (
    <div className="w-full h-full flex flex-col gap-3" style={{ minHeight: '480px' }}>
      {/* Leaflet Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/60" style={{ minHeight: '340px' }}>
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={14}
          style={{ width: '100%', height: '100%', minHeight: '340px', background: '#0a0f1e' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />

          {selectedCamera && (
            <MapCenter center={[selectedCamera.lat, selectedCamera.lng]} />
          )}

          {cameras.filter(c => c.status !== CAMERA_STATUSES.OFFLINE).map(cam => (
            <Circle
              key={`circle-${cam.id}`}
              center={[cam.lat, cam.lng]}
              radius={90}
              pathOptions={{
                color: ZONE_COLORS[cam.zone] || '#3b82f6',
                fillColor: ZONE_COLORS[cam.zone] || '#3b82f6',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '5 8',
                opacity: 0.5,
              }}
            />
          ))}

          {cameras.map(cam => {
            const { color } = getStatusInfo(cam.status);
            return (
              <Marker
                key={cam.id}
                position={[cam.lat, cam.lng]}
                icon={createCameraIcon(cam.status, cam.zone)}
                eventHandlers={{ click: () => onCameraSelect(cam) }}
              >
                <Popup>
                  <div style={{
                    background: '#0f172a', color: '#e2e8f0',
                    padding: '12px', borderRadius: '8px', minWidth: '200px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                      <strong style={{ fontSize: '13px' }}>{cam.name}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{cam.id} · {cam.zone}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Resolution: {cam.resolution} @ {cam.fps}fps</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Last Motion: {cam.lastMotion}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Uptime: {cam.uptime}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Canvas Fallback Map with label */}
      <div className="glass-card p-3" style={{ height: '240px' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tactical Overlay Map</p>
          <span className="text-xs text-slate-600 font-mono">Click camera to select</span>
        </div>
        <div style={{ height: '190px' }}>
          <CanvasFallbackMap
            cameras={cameras}
            selectedCamera={selectedCamera}
            onCameraSelect={onCameraSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default CCTVMap;

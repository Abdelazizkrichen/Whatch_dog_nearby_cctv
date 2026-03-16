import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initialCameras,
  generateInitialAlerts,
  CAMERA_STATUSES,
  ALERT_TYPES,
  ALERT_SEVERITY,
} from '../data/cameraData';

export const useWatchdog = () => {
  const [cameras, setCameras] = useState(initialCameras);
  const [alerts, setAlerts] = useState(generateInitialAlerts());
  const [systemStatus, setSystemStatus] = useState({
    totalCameras: 20,
    online: 0,
    offline: 0,
    warning: 0,
    recording: 0,
  });
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [watchdogActive, setWatchdogActive] = useState(true);
  const [lastScan, setLastScan] = useState(new Date());
  const alertIdRef = useRef(100);

  // Compute system status from cameras
  const computeStatus = useCallback((cams) => {
    const online = cams.filter(c => c.status === CAMERA_STATUSES.ONLINE || c.status === CAMERA_STATUSES.RECORDING).length;
    const offline = cams.filter(c => c.status === CAMERA_STATUSES.OFFLINE).length;
    const warning = cams.filter(c => c.status === CAMERA_STATUSES.WARNING).length;
    const recording = cams.filter(c => c.recording).length;
    setSystemStatus({ totalCameras: cams.length, online, offline, warning, recording });
  }, []);

  useEffect(() => {
    computeStatus(cameras);
  }, [cameras, computeStatus]);

  useEffect(() => {
    const active = alerts.filter(a => !a.resolved).length;
    setActiveAlertCount(active);
  }, [alerts]);

  // Watchdog simulation — random events every few seconds
  useEffect(() => {
    if (!watchdogActive) return;

    const interval = setInterval(() => {
      setLastScan(new Date());

      // Random camera status flicker
      setCameras(prev => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const cam = { ...next[idx] };

        // Small random events
        const roll = Math.random();
        if (cam.status === CAMERA_STATUSES.OFFLINE) {
          if (roll > 0.85) cam.status = CAMERA_STATUSES.WARNING;
        } else if (cam.status === CAMERA_STATUSES.WARNING) {
          if (roll > 0.7) cam.status = CAMERA_STATUSES.ONLINE;
          else if (roll < 0.1) cam.status = CAMERA_STATUSES.OFFLINE;
        } else {
          if (roll < 0.03) cam.status = CAMERA_STATUSES.WARNING;
        }

        // Update lastMotion for online cams
        if (cam.status === CAMERA_STATUSES.ONLINE && Math.random() > 0.6) {
          const mins = Math.floor(Math.random() * 10);
          cam.lastMotion = mins === 0 ? 'Just now' : `${mins} min ago`;
        }

        next[idx] = cam;
        return next;
      });

      // Occasional new alert
      if (Math.random() > 0.75) {
        setCameras(prev => {
          const onlineCams = prev.filter(c => c.status === CAMERA_STATUSES.ONLINE);
          if (onlineCams.length === 0) return prev;
          const cam = onlineCams[Math.floor(Math.random() * onlineCams.length)];

          const alertTypes = [
            { type: ALERT_TYPES.MOTION, severity: ALERT_SEVERITY.INFO, messages: ['Motion detected in camera field', 'Moving object detected', 'Person crossing boundary'] },
            { type: ALERT_TYPES.INTRUSION, severity: ALERT_SEVERITY.CRITICAL, messages: ['Perimeter breach detected!', 'Unauthorized access attempt', 'Intruder alert — restricted zone'] },
            { type: ALERT_TYPES.FACE, severity: ALERT_SEVERITY.WARNING, messages: ['Unknown face detected', 'Unrecognized individual flagged', 'Face not in approved registry'] },
          ];

          const pick = alertTypes[Math.floor(Math.random() * alertTypes.length)];
          const msg = pick.messages[Math.floor(Math.random() * pick.messages.length)];
          const newAlert = {
            id: `ALT-${String(++alertIdRef.current).padStart(3, '0')}`,
            cameraId: cam.id,
            cameraName: cam.name,
            type: pick.type,
            severity: pick.severity,
            message: msg,
            timestamp: new Date(),
            acknowledged: false,
            resolved: false,
            thumbnail: null,
          };

          setAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 100));
          return prev;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [watchdogActive]);

  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  }, []);

  const resolveAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true, resolved: true } : a));
  }, []);

  const toggleCamera = useCallback((cameraId) => {
    setCameras(prev => prev.map(cam => {
      if (cam.id !== cameraId) return cam;
      const newStatus = cam.status === CAMERA_STATUSES.OFFLINE
        ? CAMERA_STATUSES.ONLINE
        : CAMERA_STATUSES.OFFLINE;
      return { ...cam, status: newStatus, recording: newStatus !== CAMERA_STATUSES.OFFLINE };
    }));
  }, []);

  const toggleWatchdog = useCallback(() => {
    setWatchdogActive(prev => !prev);
  }, []);

  return {
    cameras,
    alerts,
    systemStatus,
    activeAlertCount,
    watchdogActive,
    lastScan,
    acknowledgeAlert,
    resolveAlert,
    toggleCamera,
    toggleWatchdog,
  };
};

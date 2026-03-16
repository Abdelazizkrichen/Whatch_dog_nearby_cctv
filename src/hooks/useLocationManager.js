import { useEffect, useState } from 'react';

const useLocationManager = () => {
    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
    const [cameras, setCameras] = useState([]);

    // Load initial camera positions from localStorage on mount
    useEffect(() => {
        const storedCameras = JSON.parse(localStorage.getItem('cameras')) || [];
        setCameras(storedCameras);
    }, []);

    // Get current location from the Geolocation API
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
            }, (error) => {
                console.error('Error getting location:', error);
            });
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    };

    // Update camera position
    const updateCameraPosition = (cameraId, newPosition) => {
        const updatedCameras = cameras.map((camera) => 
            camera.id === cameraId ? { ...camera, position: newPosition } : camera
        );
        setCameras(updatedCameras);
        localStorage.setItem('cameras', JSON.stringify(updatedCameras));
    };

    // Persist camera data to localStorage
    useEffect(() => {
        localStorage.setItem('cameras', JSON.stringify(cameras));
    }, [cameras]);

    return {
        location,
        getCurrentLocation,
        cameras,
        updateCameraPosition,
    };
};

export default useLocationManager;

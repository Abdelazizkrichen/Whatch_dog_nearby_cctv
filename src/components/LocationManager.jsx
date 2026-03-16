import React, { useState, useEffect } from 'react';

const LocationManager = () => {
  const [currentLocation, setCurrentLocation] = useState({ latitude: '', longitude: '' });
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState('');

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
        },
        error => {
          setError('Unable to retrieve your location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleAddCamera = () => {
    setCameras([...cameras, { ...currentLocation, id: Date.now() }]);
    setCurrentLocation({ latitude: '', longitude: '' });
  };

  const handleEditCamera = (id, updatedLocation) => {
    setCameras(cameras.map(camera => (camera.id === id ? updatedLocation : camera)));
  };

  const handleDeleteCamera = id => {
    setCameras(cameras.filter(camera => camera.id !== id));
  };

  const handleSave = () => {
    // Add logic to persist camera locations, e.g., sending to a server or local storage
    console.log('Saving camera locations:', cameras);
  };

  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  return (
    <div>
      <h2>Location Manager</h2>
      <button onClick={getCurrentLocation}>Get Current Location</button>
      <input
        type="text"
        placeholder="Latitude"
        value={currentLocation.latitude}
        onChange={e => setCurrentLocation({ ...currentLocation, latitude: e.target.value })}
      />
      <input
        type="text"
        placeholder="Longitude"
        value={currentLocation.longitude}
        onChange={e => setCurrentLocation({ ...currentLocation, longitude: e.target.value })}
      />
      <button onClick={handleAddCamera}>Add Camera</button>
      <ul>
        {cameras.map(camera => (
          <li key={camera.id}>
            Camera at ({camera.latitude}, {camera.longitude})
            <button onClick={() => handleEditCamera(camera.id, camera)}>Edit</button>
            <button onClick={() => handleDeleteCamera(camera.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={handleSave}>Save</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LocationManager;
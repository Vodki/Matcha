"use client";

import React, { useState } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyUsers } from '../../hooks/useNearbyUsers';

export default function LocationTestPage() {
  const { location, loading: locationLoading, error: locationError, updateLocation } = useLocation(false);
  const [radius, setRadius] = useState(200);
  const [showNearby, setShowNearby] = useState(false);
  
  const { data: nearbyData, loading: nearbyLoading, error: nearbyError, refetch } = useNearbyUsers(radius, 50);

  const handleUpdateLocation = async () => {
    try {
      await updateLocation();
      alert('Location updated successfully!');
    } catch (err) {
      alert('Failed to update location: ' + err);
    }
  };

  const handleFetchNearby = () => {
    setShowNearby(true);
    refetch();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🌍 Location Testing Dashboard</h1>

      {/* Location Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">📍 Your Location</h2>
          
          <button 
            className="btn btn-primary btn-sm w-fit" 
            onClick={handleUpdateLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Getting location...
              </>
            ) : (
              '🎯 Update My Location'
            )}
          </button>

          {locationError && (
            <div className="alert alert-error">
              <span>{locationError}</span>
            </div>
          )}

          {location && (
            <div className="bg-base-200 p-4 rounded-lg mt-4">
              <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
              <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
              {location.accuracy && (
                <p><strong>Accuracy:</strong> {location.accuracy.toFixed(0)}m</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nearby Users Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">👥 Find Nearby Users</h2>
          
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Search Radius (km)</span>
            </label>
            <input 
              type="number" 
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="input input-bordered w-full max-w-xs" 
              min={1}
              max={1000}
            />
          </div>

          <button 
            className="btn btn-secondary btn-sm w-fit mt-4" 
            onClick={handleFetchNearby}
            disabled={nearbyLoading}
          >
            {nearbyLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Searching...
              </>
            ) : (
              '🔍 Find Nearby Users'
            )}
          </button>

          {nearbyError && (
            <div className="alert alert-error mt-4">
              <span>{nearbyError}</span>
            </div>
          )}

          {showNearby && nearbyData && (
            <div className="mt-6">
              <div className="stats shadow mb-4">
                <div className="stat">
                  <div className="stat-title">Found Users</div>
                  <div className="stat-value text-primary">{nearbyData.count}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Search Radius</div>
                  <div className="stat-value text-secondary">{nearbyData.radius_km} km</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Bio</th>
                      <th>Distance</th>
                      <th>Location</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearbyData.nearby_users.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td className="max-w-xs truncate">{user.bio || 'No bio'}</td>
                        <td>
                          <div className="badge badge-primary">
                            {user.distance_km.toFixed(1)} km
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="text-xs">
                          {new Date(user.updated_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {nearbyData.count === 0 && (
                <div className="alert alert-info">
                  <span>No users found within {radius} km</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="alert alert-info mt-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div>
          <h3 className="font-bold">How to test:</h3>
          <ol className="list-decimal list-inside text-sm">
            <li>Click "Update My Location" to save your position to the database</li>
            <li>Set a search radius (default: 200km)</li>
            <li>Click "Find Nearby Users" to see who's around you</li>
            <li>Create test users with different locations to see the results!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

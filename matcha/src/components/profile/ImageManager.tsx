"use client";

import { useState, useEffect } from "react";
import api, { getImageUrl } from "@/services/api";

interface Image {
  id: number;
  path: string;
  is_profile_picture: boolean;
  created_at: string;
}

export default function ImageManager({ userId }: { userId: string }) {
  const [images, setImages] = useState<Image[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await api.getUserImages(userId);
      if (res.data?.images) {
        setImages(res.data.images);
      }
    } catch (err) {
      console.error("Failed to fetch images", err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      await api.uploadImage(file);
      fetchImages();
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Delete this image?")) return;
    try {
      await api.deleteImage(imageId);
      fetchImages();
    } catch (err) {
      alert("Failed to delete image");
    }
  };

  const handleSetProfile = async (imageId: number) => {
    try {
      await api.setProfilePicture(imageId);
      fetchImages();
      window.location.reload();
    } catch (err) {
      alert("Failed to set profile picture");
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl p-6">
      <h3 className="text-lg font-bold mb-4">Photos ({images.length}/5)</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {images.map((img) => (
          <div key={img.id} className="relative group aspect-square">
            <img
              src={getImageUrl(img.path)}
              alt="User photo"
              className={`w-full h-full object-cover rounded-lg ${img.is_profile_picture ? "ring-4 ring-primary" : ""}`}
            />
            {img.is_profile_picture && (
              <span className="absolute top-2 left-2 badge badge-primary">
                Profile
              </span>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
              {!img.is_profile_picture && (
                <>
                  <button
                    onClick={() => handleSetProfile(img.id)}
                    className="btn btn-xs btn-primary"
                  >
                    Set Profile
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="btn btn-xs btn-error"
                  >
                    Delete
                  </button>
                </>
              )}
              {img.is_profile_picture && (
                <button
                  onClick={() => handleDelete(img.id)}
                  className="btn btn-xs btn-error"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {images.length < 5 && (
          <div className="aspect-square flex items-center justify-center border-2 border-dashed border-base-content/20 rounded-lg hover:border-primary cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-center">
              {uploading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 mx-auto mb-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span className="text-sm">Add Photo</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

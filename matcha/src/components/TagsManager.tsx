"use client";

import React, { useState } from "react";
import { useTags } from "../hooks/useTags";

/**
 * Composant exemple d'utilisation des tags avec l'API backend
 * Peut être utilisé dans n'importe quelle page protégée
 */
export default function TagsManager() {
  const { tags, addTag, removeTag, isLoading, error } = useTags();
  const [newTagName, setNewTagName] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName.trim()) return;
    
    setIsAdding(true);
    const success = await addTag(newTagName.trim());
    setIsAdding(false);
    
    if (success) {
      setNewTagName("");
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    await removeTag(tagName);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Vos centres d'intérêt</h2>
        
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.length === 0 ? (
                <p className="text-gray-500">Aucun tag pour le moment</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="badge badge-primary badge-lg gap-2"
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.name)}
                      className="btn btn-ghost btn-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                placeholder="Nouveau tag..."
                className="input input-bordered flex-1"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                disabled={isAdding}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newTagName.trim() || isAdding}
              >
                {isAdding ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Ajouter"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

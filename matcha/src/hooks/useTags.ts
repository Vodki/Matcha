import { useState, useEffect } from 'react';
import api from '../services/api';

export function useTags() {
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchTags = async () => {
    setIsLoading(true);
    setError("");
    
    const result = await api.getTags();
    
    setIsLoading(false);
    
    if (result.error) {
      setError(result.error);
    } else if (result.data?.tags) {
      setTags(result.data.tags);
    }
  };

  const addTag = async (tagName: string) => {
    setError("");
    
    const result = await api.addTag(tagName);
    
    if (result.error) {
      setError(result.error);
      return false;
    }
    
    // Recharger les tags après l'ajout
    await fetchTags();
    return true;
  };

  const removeTag = async (tagName: string) => {
    setError("");
    
    const result = await api.deleteTag(tagName);
    
    if (result.error) {
      setError(result.error);
      return false;
    }
    
    // Recharger les tags après la suppression
    await fetchTags();
    return true;
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return {
    tags,
    isLoading,
    error,
    addTag,
    removeTag,
    refetch: fetchTags,
  };
}

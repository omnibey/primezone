import { useState, useEffect } from 'react';

export default function useLiveSearch(query) {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      setError(null);
      fetch(`/api/v1/products?q=${encodeURIComponent(query.trim())}&limit=5`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          if (data.success && data.data.products) {
            setResults(data.data.products);
          } else {
            setResults([]);
          }
        })
        .catch((err) => {
          console.error("Live search error:", err);
          setError(err.message);
          setResults([]);
        })
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, isSearching, error };
}

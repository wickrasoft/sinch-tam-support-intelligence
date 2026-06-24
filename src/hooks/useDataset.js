import { useEffect, useState } from 'react';

export function useDataset() {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/data/tickets.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ticket data (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDataset(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load ticket data'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { dataset, loading, error };
}

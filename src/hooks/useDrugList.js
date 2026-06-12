import { useState, useEffect } from 'react';
import { fetchDrugList } from '../services/drugListService';

export function useDrugList() {
  const [drugsData, setDrugsData] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchDrugList()
      .then(data => { if (!cancelled) setDrugsData(data); })
      .catch(err => console.error("Failed to load drug list:", err.message));
    return () => { cancelled = true; };
  }, []);

  return drugsData;
}

import { useState, useEffect, useCallback } from 'react';

// Categories are managed in Inventory → Manage Categories; fall back to the built-in list if the API is unreachable.
export const DEFAULT_CATEGORIES = ['Reading Books', 'Stationery', 'Exercise Books', 'Water Bottles', 'Trophies', 'Tennis Balls', 'Other'];

export default function useCategories() {
  const [rows, setRows] = useState([]);

  const reload = useCallback(() => {
    return fetch('http://localhost:5000/api/categories')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); })
      .catch(() => {});
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const names = rows.length ? rows.map(r => r.name) : DEFAULT_CATEGORIES;
  return { categories: names, categoryRows: rows, reloadCategories: reload };
}

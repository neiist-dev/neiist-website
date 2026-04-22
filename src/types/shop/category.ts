export interface Category {
  id: number;
  name: string;
}

export interface dbCategory {
  category_id: number;
  category_name: string;
}

export function mapdbCategoryToCategory(row: dbCategory): Category {
  return {
    id: row.category_id,
    name: row.category_name,
  };
}

export type ShoppingList = {
  id: string;
  household_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ShoppingItem = {
  id: string;
  list_id: string;
  title: string;
  is_checked: boolean;
  position: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};


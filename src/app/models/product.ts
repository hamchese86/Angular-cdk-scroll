export type ProductCategory = "Electronics" | "Home" | "Outdoor" | "Books";

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: ProductCategory;
  readonly price: number;
  readonly rating: number;
  readonly stock: number;
  readonly releaseDate: string;
  readonly accent: string;
}

export interface ProductFilters {
  readonly query: string;
  readonly category: ProductCategory | "All";
  readonly minPrice: number | null;
  readonly maxPrice: number | null;
  readonly availableFrom: string;
  readonly availableTo: string;
}

import { Product, ProductCategory } from "../models/product";

// 【商品データ生成用の候補値】
// カテゴリ
const categories: readonly ProductCategory[] = [
  "Electronics",
  "Home",
  "Outdoor",
  "Books"
];
// 名称
const names = [
  "Aurora",
  "Breeze",
  "Canvas",
  "Drift",
  "Ember",
  "Forest",
  "Glow",
  "Harbor"
];
// カラー
const colors = [
  "#6d5dfc",
  "#2f80ed",
  "#00a896",
  "#f2994a",
  "#eb5757",
  "#9b51e0"
];

/**
 * 指定件数の商品データを生成
 * 乱数は使用せず、インデックスからデータ生成
 * ※同じ件数を指定すれば毎回同じデータを作成可能
 */
export function createProducts(count: number): Product[] {
  const products: Product[] = [];

  for (let index = 0; index < count; index++) {
    // 剰余を用いてカテゴリを割り当てる（0/5 → 0, 1/5 → 1, …）
    const category = categories[index % categories.length];

    // 2026年1月1日を基とし、約10年分（3,650日）の日付を繰り返す
    // UTCで生成（※実行環境のタイムゾーンによる日付のずれを防ぐため）
    const dayOffset = index % 3650;
    const release = new Date(Date.UTC(2026, 0, 1 + dayOffset));

    products.push({
      // 【ID】1から開始 かつ 5桁ゼロ埋めに変換（ex：PRD-00001）
      id: `PRD-${String(index + 1).padStart(5, "0")}`,
      // 【商品名】名称 + カテゴリ + 連番
      name: `${names[index % names.length]} ${category} ${index + 1}`,
      // 【カテゴリ】
      category: category,
      // 【価格】範囲は 500～50,000円
      price: 500 + ((index * 137) % 49501),
      // 【評価】3 + ランダム値
      rating: 3 + ((index * 9) % 21) / 10,
      // 【在庫】範囲は 0～100個（0=在庫切れ）
      stock: (index * 8) % 101,
      // 【発売日】（ex：2026-01-01）
      releaseDate: release.toISOString().slice(0, 10),
      // 【カラー】アクセントカラー
      accent: colors[index % colors.length],
    });
  }

  return products;
}

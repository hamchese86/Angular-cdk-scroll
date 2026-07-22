import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/**
 * フォームの入力値を数値またはnullへ変換
 * 未入力（null、空文字、undefined）は任意項目として扱うためnullを返す
 */
function nullableNumber(value: unknown): number | null {
  return value === null || value === "" || value === undefined ? null : Number(value);
}

/**
 * 価格が0以上であることを検証する単項目Validator
 * 未入力は許可し、不正な場合はnonNegativePriceエラーを返却
 */
export const nonNegativePrice: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = nullableNumber(control.value);
  return value !== null && (!Number.isFinite(value) || value < 0) ? { nonNegativePrice: true } : null;
};

/**
 * 最低価格と最高価格の前後関係を検証するValidator
 * 両方が入力され、最低価格が最高価格を上回る場合にpriceRangeエラーを返却
 */
export const priceRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  // FormGroupから検証対象の値を取得
  const min = nullableNumber(control.get("minPrice")?.value);
  const max = nullableNumber(control.get("maxPrice")?.value);

  // 片方が未入力の場合は正常扱い
  return min !== null && max !== null && min > max ? { priceRange: true } : null;
};

/**
 * 発売期間の開始日と終了日の前後関係を検証するValidator
 * 両方が入力され、開始日が終了日より後の場合にdateRangeエラーを返却。
 */
export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  // date入力値はYYYY-MM-DD形式の文字列として取得
  const from = control.get("availableFrom")?.value as string | null;
  const to = control.get("availableTo")?.value as string | null;

  // YYYY-MM-DD形式は文字列のまま日付前後を比較可能
  return from && to && from > to ? { dateRange: true } : null;
};

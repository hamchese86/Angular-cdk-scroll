import { Injectable } from "@angular/core";
import { Observable, delay, of, shareReplay } from "rxjs";
import { Product } from "../models/product";

// アプリ全体で同じインスタンスを共有し、商品画像の生成結果を再利用する
@Injectable({ providedIn: "root" })
export class ProductImageService {
  // 商品IDをキーにして、画像を返すObservableをキャッシュ
  private readonly cache = new Map<string, Observable<readonly string[]>>();

  /**
   * 商品のプレビュー画像3種類を、遅延を伴うObservableとして返却
   */
  load(product: Product): Observable<readonly string[]> {
    // 生成済みの商品はキャッシュを返し、同じ画像を再生成しない
    const cached = this.cache.get(product.id);
    if (cached) return cached;

    // variant 0～2を使い、図形の異なる3種類のSVG画像を生成する
    const request = of([0, 1, 2].map((variant) => this.createSvg(product, variant))).pipe(
      // 非同期の画像取得を再現するため、商品IDに応じた擬似的な待ち時間を設定する
      delay(180 + (Number(product.id.slice(-2)) % 5) * 45),
      // 最新の取得結果1件を保持し、以降の購読者にも同じ結果を返す
      shareReplay({ bufferSize: 1, refCount: false })
    );

    // 次回以降に再利用できるよう、購読前のObservableを商品ID別に保存する
    this.cache.set(product.id, request);
    return request;
  }

  /**
   * 商品情報とバリエーション番号から、SVG形式のData URLを生成
   */
  private createSvg(product: Product, variant: number): string {
    // 商品名がSVGのタグや属性として解釈されないよう、特殊文字を取り除く
    const safeName = product.name.replace(/[<>&"']/g, "");

    // 背景に重ねる図形を選択
    const shape = variant === 0 ? "circle" : variant === 1 ? "rect" : "path";
    const artwork =
      shape === "circle"
        ? `<circle cx="130" cy="80" r="54" fill="white" fill-opacity=".18"/>`
        : shape === "rect"
          ? `<rect x="76" y="28" width="108" height="104" rx="24" fill="white" fill-opacity=".18"/>`
          : `<path d="M130 24l62 108H68z" fill="white" fill-opacity=".18"/>`;

    // 商品の色、図形、商品名、ビュー番号を組み合わせてSVGを作成
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160" viewBox="0 0 260 160"><rect width="260" height="160" rx="20" fill="${product.accent}"/>${artwork}<text x="18" y="132" fill="white" font-family="Arial" font-size="15" font-weight="700">${safeName}</text><text x="18" y="151" fill="white" fill-opacity=".72" font-family="Arial" font-size="11">VIEW ${variant + 1}</text></svg>`;

    // SVG全体をURLエンコードし、img要素のsrcで使用できるData URLへ変換
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}

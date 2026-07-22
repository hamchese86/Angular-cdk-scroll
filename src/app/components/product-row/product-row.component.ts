import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Product } from "../../models/product";
import { ProductThumbnailComponent } from "../product-thumbnail/product-thumbnail.component";

// 商品1件分の情報を一覧の1行として表示するコンポーネント
@Component({
  selector: "app-product-row",
  standalone: true,
  imports: [
    CommonModule,
    ProductThumbnailComponent
  ],
  templateUrl: "./product-row.component.html",
  styleUrls: ["./product-row.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRowComponent {
  // 親コンポーネントから表示対象の商品を受け取る
  // 「!」はAngularがコンポーネント生成後に値を設定
  @Input() product!: Product;

  // 商品価格を日本円表記へ変換するformatter
  readonly yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });
}

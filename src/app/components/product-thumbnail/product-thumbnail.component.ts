import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { interval, Subscription, timer } from "rxjs";
import { Product } from "../../models/product";
import { ProductImageService } from "../../services/product-image.service";

// 商品画像の遅延読み込みと、複数画像のプレビュー切り替えを担当するコンポーネント
@Component({
  selector: "app-product-thumbnail",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./product-thumbnail.component.html",
  styleUrls: ["./product-thumbnail.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductThumbnailComponent implements OnChanges, OnDestroy {
  // 親の商品行コンポーネントから、画像生成に使用する商品情報を受け取る
  @Input() product!: Product;

  // サービスから取得したプレビュー画像を保持
  images: readonly string[] = [];
  // 現在表示している画像のindex
  imageIndex = 0;
  // 読込中と読込完了を区別し、同じ画像の重複取得をガード
  loading = false;
  loaded = false;

  // 画像取得とプレビュータイマーを個別に停止できるよう、それぞれの購読を保持
  private imageSubscription?: Subscription;
  private previewSubscription?: Subscription;

  // コンストラクタ
  constructor(
    private readonly imageService: ProductImageService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /** 仮想スクロールによって別の商品へ再利用された場合に、表示状態を初期化する。 */
  ngOnChanges(changes: SimpleChanges): void {
    const productChange = changes["product"];
    if (!productChange || productChange.firstChange) return;

    if (productChange.previousValue?.id !== productChange.currentValue?.id) {
      this.imageSubscription?.unsubscribe();
      this.previewSubscription?.unsubscribe();
      this.imageSubscription = undefined;
      this.previewSubscription = undefined;
      this.images = [];
      this.imageIndex = 0;
      this.loading = false;
      this.loaded = false;
    }
  }

  /**
   * 初回操作時のみ、商品画像を遅延読込
   */
  load(): void {
    // 取得済み、または取得中の場合は新しい読み込みを開始しない
    if (this.loaded || this.loading) return;
    this.loading = true;

    // 画像取得処理はプレビュー停止とは分けて管理し、マウスアウト後も完了させる
    this.imageSubscription = this.imageService.load(this.product).subscribe({
      next: (images) => {
        // 取得した画像を保存し、読み込み状態を完了へ更新
        this.images = images;
        this.loading = false;
        this.loaded = true;
        // 非同期処理の完了をOnPushコンポーネントの画面へ反映する
        this.cdr.markForCheck();
      },
      error: () => {
        // 取得失敗時にスピナーが表示され続けないよう、読み込み状態を解除する
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * マウスオーバーまたはフォーカス時に画像プレビュー開始
   */
  startPreview(): void {
    // 既存のタイマーを解除（タイマー重複のガード）
    this.stopPreview();
    // 画像読込
    this.load();

    // 1000ミリ秒毎に切り替え
    this.previewSubscription = interval(1000).subscribe(() => {
        // 剰余を用いて最後の画像の次は先頭へ戻す
        if (this.images.length > 0) {
          this.imageIndex = (this.imageIndex + 1) % this.images.length;
          // timerによる更新をOnPushコンポーネントの画面へ反映する
          this.cdr.markForCheck();
        }
      });
  }

  /** プレビューを停止 */
  stopPreview(): void {
    // 画像取得は継続したまま、画像切り替えタイマーだけを解除する
    this.previewSubscription?.unsubscribe();
    this.previewSubscription = undefined;
    this.cdr.markForCheck();
  }

  /**
   * 購読解除
   */
  ngOnDestroy(): void {
    // 不要な非同期処理の継続とメモリリークを防ぐため、すべての購読を解除
    this.imageSubscription?.unsubscribe();
    this.previewSubscription?.unsubscribe();
  }
}

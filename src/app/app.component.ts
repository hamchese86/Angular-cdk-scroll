import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChild } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CdkVirtualScrollViewport, ScrollingModule } from "@angular/cdk/scrolling";
import { Subscription, debounceTime, startWith } from "rxjs";
import { Product, ProductCategory } from "./models/product";
import { createProducts } from "./data/product-data";
import { ProductRowComponent } from "./components/product-row/product-row.component";
import { dateRangeValidator, nonNegativePrice, priceRangeValidator } from "./validators/product-filter.validators";

/**
 * 商品一覧の描画形式
 * virtual : 画面に表示される範囲だけを描画する仮想スクロール
 * standard: 商品データを通常のリストとして描画する方式
 */
type RenderMode = "virtual" | "standard";

@Component({
  selector: "app-root", // htmlで使用するときのタグ名
  standalone: true, // スタンドアロンかどうか ※必要な機能をコンポーネント自身のimportsへ記述する。従来のAngularはAppModuleなどのNgModuleに登録する必要があった
  imports: [ // このコンポーネントのHTML内で使用する機能や子コンポーネントの読込
    CommonModule,
    ReactiveFormsModule,
    ScrollingModule,
    ProductRowComponent,
  ],
  templateUrl: "./app.component.html", // このコンポーネントが画面に表示するhtmlファイルを指定
  styleUrls: ["./app.component.scss"], // このコンポーネントが画面に表示するscssファイルを指定
  changeDetection: ChangeDetectionStrategy.OnPush, // 必要な場合だけ変更検知を行う
})

export class AppComponent implements OnDestroy {

  // 生成する商品データ ※初期値 = 10000件
  readonly allProducts = createProducts(10000);

  // 現在の絞り込み条件に一致する商品一覧
  filteredProducts = this.allProducts;

  // 現在選択している商品一覧の描画形式
  mode: RenderMode = "virtual";

  // 商品の絞り込み処理にかかった時間（単位：ミリ秒）
  filterDuration = 0;

  // CDKが仮想スクロール内で実際に描画している商品行数
  virtualRenderedCount = 0;

  // 通常描画モードの最大表示件数
  readonly standardLimit = 500;

  // カテゴリ選択欄に表示する選択肢
  readonly categories: readonly (ProductCategory | "All")[] = [
    "All",
    "Electronics",
    "Home",
    "Outdoor",
    "Books",
  ];

  // 商品の絞り込み条件を管理するフォーム
  // HTMLテンプレートの<form [formGroup]="form">にバインディング
  readonly form = new FormGroup(
    {
      // 【キーワード】 ※nullは許可しない かつ 最大40文字
      query: new FormControl("", {
        nonNullable: true,
        validators: [Validators.maxLength(40)],
      }),

      // 【カテゴリ】 ※nullは許容しない
      category: new FormControl<ProductCategory | "All">("All", {
        nonNullable: true,
      }),

      // 【最低価格】 ※未入力の場合はnull、0以上の値のみ可
      minPrice: new FormControl<number | null>(
        null,
        nonNegativePrice,
      ),

      // 【最高価格】 ※未入力の場合はnull、0以上の値のみ可
      maxPrice: new FormControl<number | null>(
        null,
        nonNegativePrice,
      ),

      // 【発売期間の開始日】 ※空文字は開始日による絞り込みを実施しない
      availableFrom: new FormControl("", {
        nonNullable: true,
      }),

      // 【発売期間の終了日】 ※空文字は開始日による絞り込みを実施しない
      availableTo: new FormControl("", {
        nonNullable: true,
      }),
    },
    {
      /**
       * 複数の入力項目を比較するバリデータ
       * priceRangeValidator: 最低価格が最高価格を超えていないか検証
       * dateRangeValidator: 開始日が終了日より後になっていないか検証
       */
      validators: [
        priceRangeValidator,
        dateRangeValidator,
      ],
    },
  );

  // フォームの変更監視を解除するために保持するSubscription
  private readonly subscription: Subscription;

  // 仮想スクロールの描画範囲監視を解除するために保持するSubscription
  private viewportSubscription?: Subscription;

  /**
   * コンポーネントを初期化し、フォームの変更監視を開始
   */
  constructor(private readonly cdr: ChangeDetectorRef) {
    this.subscription = this.form.valueChanges
      .pipe(
        // 初期表示時にも現在のフォーム値を流して絞り込みを実行する
        startWith(this.form.getRawValue()),

        // 連続入力のたびに処理せず、入力停止から120ms後に実行する
        debounceTime(120),
      )
      .subscribe(() => {
        // フォームの値が変化したら商品一覧を絞り込む
        this.applyFilters();
      });
  }

  /**
   * *ngIfによって生成・破棄される仮想スクロールを取得し、
   * CDKが実際に描画している範囲を監視する。
   */
  @ViewChild(CdkVirtualScrollViewport)
  set viewport(viewport: CdkVirtualScrollViewport | undefined) {
    // 表示モード切り替え前のビューポートに対する監視を解除する
    this.viewportSubscription?.unsubscribe();
    this.viewportSubscription = undefined;

    if (!viewport) return;

    this.viewportSubscription = viewport.renderedRangeStream.subscribe(
      ({ start, end }) => {
        // 描画範囲の終了位置と開始位置の差から、実際のDOM行数を求める
        this.virtualRenderedCount = end - start;
        this.cdr.markForCheck();
      },
    );
  }

  /**
   * 通常描画モードで表示する商品一覧を返却
   * @returns 通常描画で表示する商品一覧
   */
  get visibleStandardProducts(): readonly Product[] {
    return this.filteredProducts.slice(
      0,
      this.standardLimit,
    );
  }

  /**
   * 現在DOM上に描画される商品数を返却
   */
  get renderedCount(): number {
    if (this.mode === "virtual") {
      // CDKから取得した、仮想スクロール内の実際の描画行数を返す
      return this.virtualRenderedCount;
    }

    // 通常描画では、表示上限適用後の商品数を返す
    return this.visibleStandardProducts.length;
  }

  /**
   * 商品一覧の描画方式を変更
   * @param mode 新しく使用する描画方式
   */
  setMode(mode: RenderMode): void {
    this.mode = mode;
  }

  /**
   * すべての絞り込み条件を初期化
   * フォームをリセットするとvalueChangesが発生するため、
   * applyFilters()が自動的に実行
   */
  clearFilters(): void {
    this.form.reset({
      query: "",
      category: "All",
      minPrice: null,
      maxPrice: null,
      availableFrom: "",
      availableTo: "",
    });
  }

  /**
   * Angularが商品要素を識別するための商品IDを返却
   * 商品の並びや絞り込み結果が変化した場合でも、
   * 同じIDの商品に対応するDOM要素を再利用可能(性能改善可能)
   * @param _index 商品の配列内インデックス（この処理では未使用）
   * @param product 対象の商品
   * @returns 商品を一意に識別するID
   */
  trackByProductId(
    _index: number,
    product: Product,
  ): string {
    return product.id;
  }

  /**
   * コンポーネント破棄時の終了処理
   * 不要な処理やメモリリークが残ることをガード
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.viewportSubscription?.unsubscribe();
  }

  /**
   * フォームへの入力条件から商品一覧を絞り込み
   */
  private applyFilters(): void {
    // 入力内容が不正な場合は絞り込みを行わない
    if (this.form.invalid) {
      // OnPush環境でもエラー表示が更新されるように通知する
      this.cdr.markForCheck();
      return;
    }

    // 絞り込み処理の開始時刻を記録
    const started = performance.now();

    // disabledを含む、フォームの現在値をすべて取得
    const values = this.form.getRawValue();

    // キーワードの入力値の前後の空白を除去し、大文字と小文字を区別しない検索値に変換
    const query = values.query
      .trim()
      .toLocaleLowerCase();

    // すべての商品から、各条件に一致する商品だけを抽出
    this.filteredProducts = this.allProducts.filter(
      (product) => {
        /**
         * キーワードが未入力の場合はすべて一致
         * 入力されている場合は、商品名または商品IDにキーワードが含まれているか
         */
        const matchesQuery =
          !query ||
          product.name
            .toLocaleLowerCase()
            .includes(query) ||
          product.id
            .toLocaleLowerCase()
            .includes(query);

        /**
         * "All"はすべてのカテゴリが対象
         * 上記以外は一致するカテゴリが対象
         */
        const matchesCategory =
          values.category === "All" ||
          product.category === values.category;

        /**
         * 最低価格が未入力の場合はすべて一致
         * 入力されている場合は、商品価格が最低価格以上か確認
         */
        const matchesMin =
          values.minPrice === null ||
          product.price >= values.minPrice;

        /**
         * 最高価格が未入力の場合はすべて一致
         * 入力されている場合は、商品価格が最高価格以下か確認
         */
        const matchesMax =
          values.maxPrice === null ||
          product.price <= values.maxPrice;

        /**
         * 開始日が未入力の場合はすべて一致
         * 入力されている場合は、発売日が開始日以降か確認
         */
        const matchesFrom =
          !values.availableFrom ||
          product.releaseDate >= values.availableFrom;

        /**
         * 終了日が未入力の場合はすべて一致
         * 入力されている場合は、発売日が終了日以前か確認
         */
        const matchesTo =
          !values.availableTo ||
          product.releaseDate <= values.availableTo;

        // すべての条件を満たした商品を絞り込み結果に設定
        return (
          matchesQuery &&
          matchesCategory &&
          matchesMin &&
          matchesMax &&
          matchesFrom &&
          matchesTo
        );
      },
    );

    // 処理時間を記録
    this.filterDuration = performance.now() - started;

    // OnPush環境で絞り込み結果を画面へ反映するよう通知
    this.cdr.markForCheck();
  }
}

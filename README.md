# Angular CDK Scroll

10,000件の商品データを扱う、Angularのフロントエンド実装デモです。

大量データを快適に表示するための仮想スクロール、DOM要素を安定して再利用する`trackBy`、遅延読み込みとキャッシュを備えたサムネイル、Reactive Formsによる相関バリデーションを、ひとつの画面で確認できます。

商品データ、画像、画面文言は、このデモのために新しく作成しています。外部APIや外部画像サービスには依存しません。

## このプロジェクトで確認できること

- Angular CDK Virtual Scrollを使った10,000件の商品一覧
- 商品IDをキーにした安定した`trackBy`
- 通常描画と仮想スクロールの切り替え
- 検索にかかった時間と描画DOM行数の表示
- `ChangeDetectionStrategy.OnPush`による変更検知範囲の抑制
- マウスオーバーを契機とした商品画像の遅延読み込み
- RxJSの`shareReplay`を使った画像データのキャッシュ
- 商品名、商品ID、カテゴリ、価格、発売期間による絞り込み
- 価格範囲と日付範囲の相関バリデーション
- カスタムValidatorの境界値テスト
- キーボードフォーカスや代替テキストを考慮したサムネイル操作

## 画面の構成

画面は、大きく「検索条件」「性能情報」「商品一覧」の3領域で構成しています。

### 検索条件

以下の条件を組み合わせて、10,000件の商品データを絞り込めます。

- 商品名または商品IDの部分一致
- カテゴリ
- 最低価格と最高価格
- 発売期間の開始日と終了日

入力変更は120ミリ秒単位でまとめて処理し、不要な連続フィルタリングを抑えています。不正な範囲が入力されている間は一覧を更新せず、フォーム上にエラーを表示します。

### 性能情報

画面上部に次の情報を表示します。

- 絞り込み後の商品件数
- 現在の描画方式における描画DOM行数
- 商品データのフィルター処理時間
- 一覧で使用している追跡キー

仮想スクロールのDOM行数は、Angular CDKの`renderedRangeStream`から取得した描画範囲をもとに表示します。通常描画では、表示上限を適用した後の商品件数を表示します。フィルター時間は`performance.now()`を使って商品配列の絞り込み処理を計測しています。

### 商品一覧

次の2種類の描画方式を切り替えて比較できます。

#### 仮想スクロール

Angular CDKの`cdk-virtual-scroll-viewport`を使い、画面に必要な範囲だけをDOMに生成します。10,000件すべてを検索・スクロール対象にしながら、同時に保持する商品行を少数に抑えます。

#### 通常描画

通常の`*ngFor`で商品行を描画します。大量のDOM生成によるブラウザ停止を避けるため、表示は先頭500件に制限しています。どちらの方式でも、`product.id`を`trackBy`の戻り値として使用します。

## サムネイルの実装

商品行の画像領域にマウスを重ねるか、キーボードでフォーカスすると画像を読み込みます。

1. サムネイルコンポーネントが画像サービスへ商品情報を渡す
2. 画像サービスがデモ用SVGを非同期に生成する
3. 生成結果を商品ID単位でキャッシュする
4. マウスオーバー中は3種類の画像を一定間隔で切り替える
5. マウスアウトまたはコンポーネント破棄時にタイマーを解除する

外部URLを使用せず、SVGをData URLとして生成するため、オフラインでも動作します。同じ商品の画像を再表示した場合はキャッシュしたObservableを再利用します。

## バリデーションの実装

バリデーションは画面コンポーネントから分離し、Angularの`ValidatorFn`として実装しています。

### 単項目バリデーション

- 最低価格と最高価格が0以上であること
- 未入力は任意項目として許可すること

### 相関バリデーション

- 最低価格が最高価格以下であること
- 発売期間の開始日が終了日以前であること

相関チェックは個々の`FormControl`ではなく`FormGroup`へ設定しています。これにより、複数項目にまたがるルールを入力部品から独立させています。

## データフロー

```text
生成商品データ（10,000件）
          │
          ▼
Reactive Forms ── カスタムValidator
          │
          ▼
商品検索・絞り込み
          │
          ├── 仮想スクロール
          │       └── 表示範囲の商品行だけ生成
          │
          └── 通常描画
                  └── 比較用に先頭500件を生成

商品行 ── 商品サムネイル ── 画像サービス ── 商品ID別キャッシュ
```

## ファイル構成

```text
Angular-cdk-scroll/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── product-row/
│   │   │   │   ├── product-row.component.ts
│   │   │   │   ├── product-row.component.html
│   │   │   │   └── product-row.component.scss
│   │   │   └── product-thumbnail/
│   │   │       ├── product-thumbnail.component.ts
│   │   │       ├── product-thumbnail.component.html
│   │   │       └── product-thumbnail.component.scss
│   │   ├── data/
│   │   │   └── product-data.ts
│   │   ├── models/
│   │   │   └── product.ts
│   │   ├── services/
│   │   │   └── product-image.service.ts
│   │   ├── validators/
│   │   │   ├── product-filter.validators.ts
│   │   │   └── product-filter.validators.spec.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   └── app.component.scss
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

### 補足：ルートにある設定ファイル

プロジェクト直下にある次のファイルは、Angular CLI、npm、TypeScriptがビルドやテストを行うために使用します。`src`フォルダー内のような画面機能の実装ファイルではありませんが、別の環境で同じプロジェクトを再現するために必要なため、削除せずGitで管理します。

| ファイル | 役割 |
|---|---|
| `angular.json` | Angular CLIの設定ファイルです。ビルド対象、出力先、読み込むスタイル、開発用・本番用の設定などを管理します。 |
| `package.json` | プロジェクトが使用するAngularなどのパッケージと、`npm start`、`npm run build`、`npm test`などのコマンドを定義します。 |
| `package-lock.json` | `npm install`で実際に使用されるパッケージの正確なバージョンと依存関係を記録し、環境ごとの差異を抑えます。通常は手動で編集せず、npmによる更新内容をGitで管理します。 |
| `tsconfig.json` | TypeScriptの共通コンパイル設定です。型チェックの厳密さや、JavaScriptへの変換方法などを定義します。 |
| `tsconfig.app.json` | Angularアプリ本体に適用するTypeScript設定です。共通設定を継承し、アプリとしてコンパイルするファイルを指定します。 |
| `tsconfig.spec.json` | 単体テストに適用するTypeScript設定です。テストファイルやJasmineの型定義を扱うために使用します。 |

`tsconfig.app.json`と`tsconfig.spec.json`は、共通の`tsconfig.json`を用途別に拡張する関係です。設定を変更する場合は、アプリとテストの両方に適用したい内容か、片方だけに適用したい内容かを確認して編集します。

## 主要ファイル

### `src/app/app.component.ts`

デモ画面全体の状態を管理します。

- 10,000件の商品データを生成
- Reactive Formsの定義
- 検索条件変更の監視とデバウンス
- 商品の絞り込み
- フィルター処理時間の計測
- 仮想スクロールと通常描画の切り替え
- `trackByProductId`による商品行の追跡

### `src/app/app.component.html`

検索フォーム、性能情報、描画方式切り替え、商品一覧を配置します。仮想スクロールでは`*cdkVirtualFor`、通常描画では`*ngFor`を使用し、両方に同じ`trackBy`関数を設定しています。

### `src/app/components/product-row/product-row.component.ts`

商品1件分の表示コンポーネントです。商品名、ID、カテゴリ、価格、評価、在庫、発売日とサムネイルを表示します。

`OnPush`変更検知を設定し、入力された商品オブジェクトが変わっていない場合の不要な変更検知を抑えています。

### `src/app/components/product-thumbnail/product-thumbnail.component.ts`

共通サムネイルコンポーネントです。

- 初回操作時の画像読み込み
- ローディング表示
- ホバープレビュー用タイマー
- 3画像の循環表示
- マウスアウト時の停止
- コンポーネント破棄時の購読解除

画像取得方法をサービスへ分離しているため、実際のHTTP APIへ置き換える場合でも表示側の変更を小さくできます。

### `src/app/services/product-image.service.ts`

商品画像の取得とキャッシュを担当します。

- 商品情報から3種類のSVG画像を生成
- ネットワーク通信を模した遅延
- 商品IDをキーにしたObservableキャッシュ
- `shareReplay`による取得結果の再利用

### `src/app/validators/product-filter.validators.ts`

検索フォームで使用するカスタムValidatorです。

- `nonNegativePrice`: 価格が0以上か検証
- `priceRangeValidator`: 最低価格と最高価格の前後関係を検証
- `dateRangeValidator`: 開始日と終了日の前後関係を検証

すべて副作用を持たない関数として実装しています。

### `src/app/validators/product-filter.validators.spec.ts`

Validatorの単体テストです。負数、任意項目の未入力、逆転した価格範囲、逆転した日付範囲を検証します。

### `src/app/data/product-data.ts`

外部APIの代わりに、再現可能な商品データを生成します。商品ID、商品名、カテゴリ、価格、評価、在庫、発売日、サムネイル色をインデックスから決定するため、実行するたびに同じ結果になります。

### `src/app/models/product.ts`

商品と検索条件の型を定義します。画面固有のデータ構造を持ち込まず、一般的な商品一覧で利用できるプロパティだけを使用しています。

## 使用技術

| 技術 | バージョン・用途 |
|---|---|
| Angular | 15.2 |
| Angular CDK | 15.2 / Virtual Scroll |
| Angular Reactive Forms | 検索フォームと相関バリデーション |
| RxJS | デバウンス、非同期画像、キャッシュ |
| TypeScript | 4.9 / Strict Mode |
| Jasmine + Karma | Validatorの単体テスト |
| SCSS | コンポーネント単位のスタイル |

## セットアップ

以下のコマンドは、Windowsの「コマンド プロンプト」またはVS Codeのターミナル（PowerShell）で実行できます。コマンド プロンプトは、スタートメニューで「コマンド プロンプト」または「cmd」を検索して起動できます。

### 必要な環境

- Git
- Node.js 18以降
- npm（Node.jsをインストールすると一緒にインストールされます）

初回のみ、次のソフトウェアを準備します。

1. [Git公式サイト](https://git-scm.com/download/win)からGit for Windowsをインストールします。
2. [Node.js公式サイト](https://nodejs.org/)からNode.jsをインストールします。
3. コマンド プロンプトを開き直し、次のコマンドでインストール結果を確認します。

```bat
git --version
node --version
npm --version
```

`npm install`は、このプロジェクトが利用するAngularなどのパッケージをインストールするコマンドです。Node.jsやnpmそのものはインストールされないため、先にNode.jsの準備が必要です。

### Git、Node.js、npmが認識されない場合

インストール後に次のようなエラーが表示される場合、起動中のコマンド プロンプトやVS Codeに新しい環境変数が反映されていない可能性があります。

```text
'git' は、内部コマンドまたは外部コマンドとして認識されていません。
npm: 用語 'npm' は認識されません。
```

まず、開いているコマンド プロンプトとVS Codeをすべて終了してから起動し直し、バージョンを再確認します。

```bat
git --version
node --version
npm --version
```

まだ認識されない場合は、次のファイルが存在するか確認します。PowerShellでは`Test-Path`の結果が`True`になれば、ファイルが存在します。

```powershell
Test-Path "C:\Program Files\Git\cmd\git.exe"
Test-Path "C:\Program Files\nodejs\node.exe"
Test-Path "C:\Program Files\nodejs\npm.cmd"
```

ファイルが存在する場合は、Windowsの環境変数`Path`に次の2つを追加します。

```text
C:\Program Files\Git\cmd
C:\Program Files\nodejs
```

設定後は、コマンド プロンプトとVS Codeを完全に終了して起動し直してください。それでも反映されない場合は、Windowsを再起動します。ファイルが存在しない場合は、GitまたはNode.jsを再インストールし、インストール時にPATHへ追加する設定を有効にしてください。

### GitHubからクローンする

このリポジトリは、GitHubのアカウントやSSHキーがなくてもHTTPSでクローンできます。

コマンド プロンプトで、プロジェクトを保存したいフォルダーへ移動してから実行します。次は、ユーザーのドキュメントフォルダーへ保存する例です。

```bat
cd %USERPROFILE%\Documents
git clone https://github.com/hamchese86/Angular-cdk-scroll.git
cd Angular-cdk-scroll
```

`cd Angular-cdk-scroll`を実行した後のフォルダーが、このプロジェクトのルートフォルダーです。以降のインストール、開発サーバー、ビルド、単体テストのコマンドは、すべてこのフォルダーで実行します。

### インストール

クローン後、プロジェクトのルートフォルダーで実行します。

```bat
npm install
```

### 開発サーバー

プロジェクトのルートフォルダーで実行します。

```bat
npm start
```

起動後、`http://localhost:4200`をブラウザで開きます。

`npm start`は開発・動作確認用です。開発サーバーが起動してソースコードの変更を監視し、保存した変更をブラウザへ反映します。終了するときは、ターミナルで`Ctrl + C`を押します。

## ビルドとテスト

### 本番ビルド

プロジェクトのルートフォルダーで実行します。

```bat
npm run build
```

ビルド結果は`dist/demo`へ出力されます。

`npm run build`は配布・公開用のファイルを作成するコマンドです。AngularやTypeScriptのコードをブラウザ用のHTML、CSS、JavaScriptへ変換します。開発サーバーは起動せず、ビルドが完了するとコマンドも終了します。

普段の開発やブラウザでの動作確認には`npm start`、配布・公開する成果物の作成には`npm run build`を使用します。見た目や基本動作は原則同じですが、ビルド結果は公開向けに最適化されます。生成された`index.html`は直接開かず、Webサーバーを通して表示してください。

### 単体テスト

プロジェクトのルートフォルダーで実行します。

```bat
npm test
```

Chrome Headless上でValidatorのテストを実行します。

## 設計上のポイント

### `trackBy`には変更されないIDを使用する

一覧の配列が再生成されても同じ商品を同じDOM要素として扱えるよう、配列インデックスではなく商品IDを返します。並べ替えや絞り込みが発生する一覧では、インデックスをキーにすると異なる商品へDOMが再利用される可能性があります。

### 仮想スクロールと`trackBy`を組み合わせる

仮想スクロールはDOM要素数を抑え、`trackBy`はデータ更新時のDOM再生成を抑えます。それぞれ対象とする問題が異なるため、両方を組み合わせています。

### 表示、取得、検証を分離する

商品行、サムネイル、画像取得、Validator、データ生成を別ファイルに分けています。各処理の責務を限定することで、テストやAPI差し替えを行いやすくしています。

## 現在の制約と改善候補

- 商品データはメモリ上で生成しており、実際のバックエンドAPIには接続していません
- 通常描画のDOM行数は安全のため500件に制限しています
- 仮想スクロールのDOM行数は、Angular CDKが通知する描画範囲をもとに算出しています
- テスト対象は現在Validatorが中心です
- Angular 15を使用しているため、公開運用時にはサポート中のAngularバージョンへの更新を検討してください

今後は、コンポーネントテスト、画像取得失敗時の表示、APIキャンセル、ソート、ページネーション、アクセシビリティテストなどを追加できます。

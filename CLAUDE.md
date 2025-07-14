# Claude開発者向けメモ

このファイルは、Claude Code利用時の開発コンテキストと設定を記録しています。

## プロジェクト概要

**プロジェクト名**: Cookery - レシピ検索アプリ  
**技術スタック**: HTML5, CSS3, JavaScript (ES6+), TheMealDB API  
**アーキテクチャ**: フロントエンドのみ（静的サイト）  

## 開発コマンド

### テスト・ビルド
```bash
# 静的ファイルなので特別なビルドプロセスは不要
# ローカルサーバーでテスト
python -m http.server 8000
# または
npx live-server
```

### リント・フォーマット
```bash
# 現在設定されているリント・フォーマットツールはありません
# 必要に応じて以下のツールを検討:
# - ESLint (JavaScript)
# - Prettier (コードフォーマット)
# - stylelint (CSS)
```

## プロジェクト構造

```
recipe-finder/
├── index.html          # メインHTML - アプリケーションのエントリーポイント
├── styles.css          # スタイルシート - レスポンシブデザイン、UI/UX
├── script.js           # JavaScript - メインアプリケーションロジック
├── docs/
│   └── design.md       # 要件定義書 - 機能仕様とAPI仕様
├── README.md           # プロジェクトドキュメント
├── CLAUDE.md           # このファイル - Claude開発者向け情報
└── LICENSE             # MITライセンス
```

## 主要コンポーネント

### RecipeSearchApp クラス (script.js)
- **検索機能**: `handleSearch()`, `searchRecipes()`, `searchByCategory()`
- **お気に入り機能**: `toggleFavorite()`, `loadFavorites()`, `saveFavorites()`
- **カテゴリ機能**: `loadCategories()`, `renderCategories()`, `selectCategory()`
- **UI管理**: `showModal()`, `hideModal()`, `showLoading()`, `hideLoading()`
- **ナビゲーション**: `showSearchView()`, `showFavoritesView()`

### CSS設計
- **レスポンシブ**: モバイルファースト設計
- **コンポーネント**: `.recipe-card`, `.modal`, `.category-btn`, `.nav-btn`
- **レイアウト**: Grid + Flexbox
- **アニメーション**: CSS Transitions, Loading spinner

## API仕様

### TheMealDB API エンドポイント
- **カテゴリ一覧**: `GET /categories.php`
- **料理名検索**: `GET /search.php?s={query}`
- **食材検索**: `GET /filter.php?i={ingredient}`
- **カテゴリ検索**: `GET /filter.php?c={category}`
- **レシピ詳細**: `GET /lookup.php?i={id}`

### データ構造
```javascript
// レシピオブジェクト
{
  idMeal: string,
  strMeal: string,
  strCategory: string,
  strMealThumb: string,
  strInstructions: string,
  strIngredient1-20: string,
  strMeasure1-20: string,
  strYoutube: string
}

// カテゴリオブジェクト
{
  idCategory: string,
  strCategory: string,
  strCategoryThumb: string,
  strCategoryDescription: string
}
```

## 状態管理

### localStorage キー
- `cookery-favorites`: お気に入りレシピの保存
  ```javascript
  {
    [mealId]: {
      idMeal: string,
      strMeal: string,
      strMealThumb: string,
      strCategory: string,
      addedAt: string (ISO datetime)
    }
  }
  ```

### アプリケーション状態
- `this.favorites`: お気に入り一覧
- `this.categories`: カテゴリ一覧
- `this.selectedCategory`: 現在選択中のカテゴリ
- `this.currentRecipe`: モーダル表示中のレシピ

## 既知の課題・制限事項

### API制限
- TheMealDB free tier: 開発用のみ（本番環境では有料版が必要）
- カテゴリ検索結果にstrCategoryが含まれない → 手動で追加

### ブラウザ対応
- localStorage使用: IE8+対応
- fetch API使用: IE未対応（Polyfillで対応可能）
- CSS Grid使用: IE11では部分対応

### パフォーマンス
- 画像の遅延読み込み未実装
- 検索結果のページネーション未実装
- キャッシュ機能未実装

## 拡張機能のアイデア

### 短期的改善
- 検索履歴機能
- レシピ評価機能
- 印刷機能
- レシピ共有機能

### 中期的改善
- PWA化（オフライン対応）
- 食材在庫管理
- 栄養情報表示
- 多言語対応

### 長期的改善
- ユーザー認証
- レシピ投稿機能
- コミュニティ機能
- AI推薦機能

## デバッグ・トラブルシューティング

### 一般的な問題
1. **API通信エラー**
   - ネットワーク接続を確認
   - CORS設定を確認
   - API制限に達していないか確認

2. **localStorage エラー**
   - プライベートモードでないか確認
   - ストレージ容量制限に達していないか確認

3. **レスポンシブデザイン問題**
   - デベロッパーツールでデバイスシミュレーション
   - CSS メディアクエリの確認

### デバッグ設定
```javascript
// デバッグモードを有効にする場合
const DEBUG = true;
if (DEBUG) {
  console.log('Debug mode enabled');
}
```

## セキュリティ考慮事項

### 現在の実装
- XSS対策: `innerHTML`使用時は信頼できるAPIデータのみ
- CSRF対策: 不要（APIはGETのみ）
- データ漏洩対策: 機密データなし

### 改善点
- Content Security Policy の設定
- API通信のHTTPS強制
- 入力値のサニタイゼーション強化

## 最後に

このプロジェクトは学習・デモ目的で作成されました。本番環境での使用を検討する場合は、以下の点を検討してください：

- TheMealDB API の有料プランへの移行
- より堅牢なエラーハンドリング
- セキュリティ対策の強化
- パフォーマンス最適化
- テストコードの追加
# AI Chatbot - Next.js ChatGPT風チャットアプリケーション

Modern AI chatbot application built with Next.js, featuring a ChatGPT-like interface with guest mode support and OpenAI integration.

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.14-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2d3748)
![Azure](https://img.shields.io/badge/Azure-App%20Service-0078d4)

## 🌟 特徴

- **🤖 AI チャット**: OpenAI GPT-4o統合による高度な会話機能
- **👥 ゲストモード**: アカウント登録不要で即座に利用開始
- **💬 ChatGPT風UI**: 直感的で使いやすいチャットインターフェース
- **📱 レスポンシブデザイン**: デスクトップ・モバイル対応
- **🗂️ 会話履歴**: セッション管理と会話履歴の保存
- **🖼️ 画像対応**: 画像アップロード・表示機能
- **🔐 認証システム**: NextAuth.js + ゲストモード
- **☁️ クラウド対応**: Azure App Service自動デプロイ

## 🚀 ライブデモ

**本番環境**: [https://chatbot-app-new.azurewebsites.net](https://chatbot-app-new.azurewebsites.net)

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14.2.5** - React フレームワーク
- **TypeScript** - 型安全な開発
- **TailwindCSS** - ユーティリティファーストCSS
- **Heroicons** - アイコンライブラリ

### バックエンド
- **Next.js API Routes** - サーバーサイド API
- **Prisma** - データベース ORM
- **NextAuth.js** - 認証システム
- **OpenAI API** - AI チャット機能

### データベース
- **SQL Server** (本番環境)
- **SQLite** (ローカル開発)

### インフラ・デプロイ
- **Azure App Service** - ホスティング
- **GitHub Actions** - CI/CD パイプライン
- **Prisma Studio** - データベース管理

### 状態管理
- **Zustand** - 軽量状態管理ライブラリ

## 📦 インストール

### 前提条件

- Node.js 18.x以上
- npm 8.x以上

### セットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/Ayumu277/first-chatbot.git
cd first-chatbot
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
cp .env.example .env
```

`.env`ファイルを編集:
```env
# Database (Local Development)
DATABASE_URL="file:./dev.db"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
```

4. **データベースのセットアップ**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **開発サーバーの起動**
```bash
npm run dev
```

アプリケーションが [http://localhost:3000](http://localhost:3000) で起動します。

## 📊 データベース管理

### Prisma Studio
```bash
npx prisma studio
```
[http://localhost:5555](http://localhost:5555) でデータベースを視覚的に管理できます。

### マイグレーション
```bash
# 新しいマイグレーション作成
npx prisma migrate dev --name migration_name

# 本番環境マイグレーション
npx prisma migrate deploy
```

## 🏗️ プロジェクト構造

```
├── app/                      # Next.js App Router
│   ├── api/                 # API ルート
│   │   ├── auth/           # 認証 API
│   │   ├── chat/           # チャット API
│   │   ├── chat-sessions/  # セッション管理 API
│   │   └── users/          # ユーザー管理 API
│   ├── components/         # React コンポーネント
│   │   ├── AuthWrapper.tsx # 認証ラッパー
│   │   ├── ChatWindow.tsx  # チャットウィンドウ
│   │   ├── Sidebar.tsx     # サイドバー
│   │   └── SessionProvider.tsx
│   ├── store/              # 状態管理 (Zustand)
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # レイアウト
│   └── page.tsx            # メインページ
├── prisma/                  # データベース設定
│   ├── schema.prisma       # スキーマ定義
│   └── migrations/         # マイグレーションファイル
├── types/                   # TypeScript型定義
├── .github/workflows/       # GitHub Actions
└── public/                  # 静的ファイル
```

## 🎯 主要機能

### 1. ゲストモード
- アカウント登録不要
- 一時的なユーザー作成
- ローカルストレージでセッション管理

### 2. チャット機能
- リアルタイムAI応答
- 画像アップロード対応
- メッセージ編集・再送信
- 会話履歴保存

### 3. セッション管理
- 複数チャットセッション
- セッション削除
- タイトル自動生成

### 4. レスポンシブUI
- モバイルファーストデザイン
- サイドバー折りたたみ
- ダークテーマ

## 🚀 デプロイ

### Azure App Service (自動デプロイ)

1. **GitHub Actions設定済み**
   - `main`ブランチへのプッシュで自動デプロイ
   - ビルド・テスト・デプロイの自動化

2. **環境変数設定**

   Azure App Service → 設定 → 環境変数で以下を設定:
   ```
   DATABASE_URL=your-sql-server-connection-string
   NEXTAUTH_URL=https://your-app.azurewebsites.net
   NEXTAUTH_SECRET=your-production-secret
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **デプロイ手順**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

### 手動デプロイ (その他プラットフォーム)

```bash
npm run build
npm start
```

## 🔧 開発

### コマンド一覧

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Linting
npm run lint

# Prisma Studio
npx prisma studio

# データベースリセット
npx prisma migrate reset
```

### 開発のベストプラクティス

1. **型安全性**: TypeScriptを活用した型定義
2. **コンポーネント設計**: 再利用可能なコンポーネント
3. **状態管理**: Zustandで軽量な状態管理
4. **スタイリング**: TailwindCSSでユーティリティファースト
5. **データベース**: Prismaで型安全なDB操作

## 🔐 セキュリティ

- **認証**: NextAuth.js
- **環境変数**: 機密情報の安全な管理
- **SQL インジェクション対策**: Prisma ORM
- **HTTPS**: 本番環境でのSSL/TLS

## 🐛 トラブルシューティング

### よくある問題

1. **TailwindCSS が適用されない**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **データベース接続エラー**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. **OpenAI API エラー**
   - API キーの確認
   - 使用量制限の確認

### ログの確認

```bash
# 本番環境ログ
# Azure App Service → 監視 → ログストリーム

# ローカル開発
# ブラウザの開発者ツール → Console
```

## 📈 パフォーマンス

- **Next.js 14**: App Router による最適化
- **画像最適化**: Next.js Image コンポーネント
- **コード分割**: 動的インポート
- **キャッシュ戦略**: ISR (Incremental Static Regeneration)

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 作成者

**Ayumu277**
- GitHub: [@Ayumu277](https://github.com/Ayumu277)

## 🙏 謝辞

- [OpenAI](https://openai.com/) - GPT-4o API
- [Vercel](https://vercel.com/) - Next.js フレームワーク
- [Prisma](https://prisma.io/) - データベース ORM
- [TailwindCSS](https://tailwindcss.com/) - CSSフレームワーク

---

## 📞 サポート

質問や問題がある場合は、[Issues](https://github.com/Ayumu277/first-chatbot/issues) でお知らせください。

**Happy Coding! 🚀**
# Force redeploy #午後

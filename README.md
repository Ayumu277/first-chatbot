# 生成AI対応チャットボット

Next.js、TypeScript、OpenAI API を使用したチャットボットアプリケーションです。

## 機能

- テキストメッセージでの会話
- 画像アップロード機能付きの質問
- 会話履歴の保存・管理
- セッションベースのチャット管理

## 技術スタック

- **フロントエンド**: React (Next.js), TypeScript
- **バックエンド**: Next.js API Routes
- **データベース**: Azure SQL Database
- **AI API**: OpenAI GPT API
- **デプロイ**: Azure App Service

## プロジェクト構成

```
├── pages/
│   ├── index.tsx              # 履歴選択画面 (S-02)
│   ├── chat/[sessionId].tsx   # チャット画面 (S-01)
│   └── api/
│       ├── chat.ts            # GPT API呼び出し
│       └── upload.ts          # 画像アップロード
├── components/
│   ├── ChatInput.tsx          # テキスト＋画像入力エリア
│   ├── ChatMessages.tsx       # メッセージリスト
│   ├── ChatHeader.tsx         # セッション情報・ナビゲーション
│   └── HistoryList.tsx        # 履歴一覧
├── package.json
├── tsconfig.json
└── next.config.js
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Azure SQL Database
DATABASE_URL=your_azure_sql_connection_string_here

# Next.js設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスしてください。

## 画面構成

### S-01: チャット画面 (`/chat/[sessionId]`)
- チャットメッセージの表示
- テキスト入力エリア
- 画像アップロード機能
- セッション情報の表示

### S-02: 履歴選択画面 (`/`)
- 過去のチャットセッション一覧
- 新しいチャットの開始
- セッションの再開

## 開発状況

現在、基本的なファイル構成のみが作成されています。

### 次の実装ステップ
1. データベーススキーマの設計・実装
2. API Routes の実装
3. フロントエンドコンポーネントの機能実装
4. スタイリングの実装
5. デプロイ設定

## デプロイ

### Azure App Service

このプロジェクトはAzure App Serviceにデプロイできます。

Azure App Serviceにデプロイする場合：
1. [Azure Portal](https://portal.azure.com)でApp Serviceを作成
2. Runtime stack: Node.js 18 LTS
3. GitHubリポジトリと連携
4. 環境変数を設定：
   - `OPENAI_API_KEY`: OpenAI APIキー
   - `DATABASE_URL`: Azure SQL Databaseの接続文字列
   - `NEXTAUTH_URL`: アプリのURL (https://your-app-name.azurewebsites.net)
   - `NEXTAUTH_SECRET`: NextAuth.jsの秘密鍵
5. デプロイ完了

### Vercel

このプロジェクトは[Vercel](https://vercel.com)にもデプロイできます。

## 注意事項

- OpenAI API キーは必ず `.env.local` ファイルに設定してください
- 画像アップロードは現在Base64形式で処理されます
- Azure SQL Database への接続設定が必要です# Updated #午後

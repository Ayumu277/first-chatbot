#!/usr/bin/env node

// DATABASE_URL形式のテストスクリプト
console.log('🔍 DATABASE_URL形式の確認');

// 現在の形式（間違い）
const wrongFormat = "sqlserver://chatbot-sqlserver.database.windows.net:1433;database=chatbot-db;user=sqladmin;password=Takatyanz8;encrypt=true;trustServerCertificate=false";

// 正しい形式
const correctFormat = "sqlserver://sqladmin:Takatyanz8@chatbot-sqlserver.database.windows.net:1433;database=chatbot-db;encrypt=true;trustServerCertificate=false";

console.log('❌ 間違った形式:');
console.log(wrongFormat);
console.log('');
console.log('✅ 正しい形式:');
console.log(correctFormat);
console.log('');

console.log('🔧 修正が必要な点:');
console.log('1. user=sqladmin;password=Takatyanz8 → sqladmin:Takatyanz8@');
console.log('2. ユーザー名:パスワードは@マークの前に配置');
console.log('3. user=とpassword=の形式は使用しない');

// Prismaクライアントでテスト
try {
  // 正しい形式での接続テスト
  console.log('🚀 Prismaクライアントでの接続テスト用URL:');
  console.log(`DATABASE_URL="${correctFormat}"`);
} catch (error) {
  console.error('エラー:', error.message);
}
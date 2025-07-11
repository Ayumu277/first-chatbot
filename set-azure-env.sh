#!/bin/bash

# Azure App Service環境変数設定スクリプト
# 使用前に以下の値を実際の値に変更してください

WEBAPP_NAME="chatbot-app-container"
RESOURCE_GROUP="chatbot-app-new_group"

echo "🔧 Azure App Service環境変数を設定中..."
echo "Webapp: $WEBAPP_NAME"
echo "Resource Group: $RESOURCE_GROUP"

# 環境変数を設定
az webapp config appsettings set \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="sqlserver://sqladmin:Takatyanz8@chatbot-sqlserver.database.windows.net:1433;database=chatbot-db;encrypt=true;trustServerCertificate=false" \
    SHADOW_DATABASE_URL="sqlserver://sqladmin:Takatyanz8@chatbot-sqlserver.database.windows.net:1433;database=chatbot-shadow-db;encrypt=true;trustServerCertificate=false" \
    OPENAI_API_KEY="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" \
    NEXTAUTH_SECRET="UurOCE1PlzTaWZt5BsQ5NolPHMF/DgY/3qITk8OCh2w=" \
    NEXTAUTH_URL="https://chatbot-app-container-fse7g9cnf8hfgpej.japaneast-01.azurewebsites.net/" \
    RESEND_API_KEY="re_b5tqTN8t_LHgMssDnmQeXZC5egKjB39Tq" \
    WEBSITES_PORT=8080 \
    NODE_ENV=production \
    PORT=8080

echo "✅ 環境変数の設定が完了しました"

# 設定を確認
echo "📋 現在の設定:"
az webapp config appsettings list --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --output table

# Azure App Serviceを再起動
echo "🔄 Azure App Serviceを再起動中..."
az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP

echo "🎉 設定完了！数分後にアプリケーションが利用可能になります。"
echo "🌐 アプリケーションURL: https://chatbot-app-container-fse7g9cnf8hfgpej.japaneast-01.azurewebsites.net/"
echo ""
echo "✅ DATABASE_URLが正しい形式に修正されました："
echo "   sqlserver://sqladmin:Takatyanz8@chatbot-sqlserver.database.windows.net:1433;database=chatbot-db;encrypt=true;trustServerCertificate=false"
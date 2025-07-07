#!/bin/bash

# Azure App Service環境変数設定スクリプト
# 使用前に以下の値を実際の値に変更してください

WEBAPP_NAME="chatbot-app-new"
RESOURCE_GROUP="chatbot-app-new_group"

# 環境変数を設定
az webapp config appsettings set \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="Server=tcp:chatbot-sqlserver.database.windows.net,1433;Initial Catalog=chatbot-db;Persist Security Info=False;User ID=chatbot-admin;Password=YourPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;" \
    OPENAI_API_KEY="your-openai-api-key-here" \
    NEXTAUTH_SECRET="your-nextauth-secret-here" \
    NEXTAUTH_URL="https://chatbot-app-new.azurewebsites.net" \
    WEBSITES_PORT=8080 \
    NODE_ENV=production \
    PORT=8080

echo "環境変数の設定が完了しました"

# 設定を確認
echo "現在の設定:"
az webapp config appsettings list --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --output table

# Azure App Serviceを再起動
echo "Azure App Serviceを再起動中..."
az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP

echo "設定完了！数分後にアプリケーションが利用可能になります。"
echo "アプリケーションURL: https://$WEBAPP_NAME.azurewebsites.net"
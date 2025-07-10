#!/bin/bash
# 🚀 Azure App Service用マルチアーキテクチャ対応デプロイスクリプト v3
# TailwindCSS本番環境対応版

set -e

echo "🚀 Starting deployment process..."

# 設定
DOCKER_USERNAME="ayumu277"
IMAGE_NAME="chatbot-app"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}"

echo "📋 Build configuration:"
echo "- Docker username: ${DOCKER_USERNAME}"
echo "- Image name: ${IMAGE_NAME}"
echo "- Full image name: ${FULL_IMAGE_NAME}"

# Docker Buildxが有効か確認
echo "🔧 Checking Docker Buildx..."
if ! docker buildx version >/dev/null 2>&1; then
    echo "❌ Docker Buildx is not available"
    echo "Please enable Docker Desktop experimental features or install Buildx"
    exit 1
fi

# マルチアーキテクチャビルダーの作成・使用
echo "🏗️  Setting up multi-architecture builder..."
docker buildx create --name multiarch-builder --use --bootstrap 2>/dev/null || docker buildx use multiarch-builder

# 既存のコンテナとイメージをクリーンアップ
echo "🧹 Cleaning up existing containers and images..."
docker stop $(docker ps -q --filter ancestor=${FULL_IMAGE_NAME}) 2>/dev/null || true
docker rm $(docker ps -aq --filter ancestor=${FULL_IMAGE_NAME}) 2>/dev/null || true
docker rmi ${FULL_IMAGE_NAME}:latest 2>/dev/null || true

# TailwindCSS環境変数設定
export DISABLE_CSSNANO=true
export TAILWIND_MODE=build

echo "🎨 TailwindCSS build settings:"
echo "- DISABLE_CSSNANO: ${DISABLE_CSSNANO}"
echo "- TAILWIND_MODE: ${TAILWIND_MODE}"

# マルチアーキテクチャビルド実行
echo "🔨 Building multi-architecture Docker image..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg DISABLE_CSSNANO=true \
  --build-arg TAILWIND_MODE=build \
  -t ${FULL_IMAGE_NAME}:latest \
  --push \
  .

if [ $? -eq 0 ]; then
    echo "✅ Multi-architecture build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# イメージ情報表示
echo "📊 Image information:"
docker buildx imagetools inspect ${FULL_IMAGE_NAME}:latest

# ローカルテスト（オプション）
read -p "🧪 Do you want to run a local test? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 Running local test..."

    # AMD64版をプルしてテスト
    docker pull --platform linux/amd64 ${FULL_IMAGE_NAME}:latest

    echo "🚀 Starting test container..."
    docker run -d \
      --name test-container \
      --platform linux/amd64 \
      -p 8080:8080 \
      -e DISABLE_CSSNANO=true \
      -e TAILWIND_MODE=build \
      ${FULL_IMAGE_NAME}:latest

    echo "⏳ Waiting for container to start..."
    sleep 10

    # ヘルスチェック
    if curl -f http://localhost:8080 >/dev/null 2>&1; then
        echo "✅ Local test passed - app is responding"
    else
        echo "❌ Local test failed - app is not responding"
        docker logs test-container
    fi

    # テストコンテナクリーンアップ
    docker stop test-container 2>/dev/null || true
    docker rm test-container 2>/dev/null || true

    echo "🧹 Test container cleaned up"
fi

echo "🎉 Deployment completed successfully!"
echo "📝 Next steps:"
echo "1. Your multi-architecture image is available at: ${FULL_IMAGE_NAME}:latest"
echo "2. Azure App Service will automatically use the linux/amd64 version"
echo "3. TailwindCSS styles are preserved with the safelist configuration"
echo "4. The image supports both AMD64 and ARM64 architectures"

echo "🔗 Image URL for Azure App Service:"
echo "   docker.io/${FULL_IMAGE_NAME}:latest"
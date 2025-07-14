'use client'

import { useState, useRef } from 'react'
import { PaperClipIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface UploadedImage {
  file: File
  base64: string
  preview: string
  mimeType: string
}

interface ImageUploadProps {
  uploadedImage: UploadedImage | null
  onImageUpload: (image: UploadedImage) => void
  onImageRemove: () => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export default function ImageUpload({
  uploadedImage,
  onImageUpload,
  onImageRemove,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 画像ファイルをBase64に変換
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        // data:image/jpeg;base64, の部分を除去（API用）
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const convertToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataURL = reader.result as string
        resolve(dataURL)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 画像ファイルの処理
  const handleImageUpload = async (file: File) => {
    // 画像ファイルのみを許可
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルのみアップロード可能です')
      return
    }

    try {
      const base64 = await convertToBase64(file)
      const dataURL = await convertToDataURL(file)

      onImageUpload({
        file,
        base64,
        preview: dataURL,
        mimeType: file.type
      })
    } catch (error) {
      console.error('画像の処理中にエラーが発生しました:', error)
      alert('画像の処理中にエラーが発生しました')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // inputをリセット（同じファイルを再選択可能にする）
    e.target.value = ''
  }

  return (
    <div className="relative">
      {/* 画像アップロードボタン */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
        title="画像をアップロード"
      >
        <PaperClipIcon className="h-5 w-5" />
      </button>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ドラッグ&ドロップオーバーレイ */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <PhotoIcon className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-500 font-medium">画像をドロップしてください</p>
          </div>
        </div>
      )}

      {/* アップロードされた画像のプレビュー */}
      {uploadedImage && (
        <div className="mt-2 relative inline-block">
          <img
            src={uploadedImage.preview}
            alt="アップロード画像"
            className="max-w-xs max-h-32 rounded-lg border border-gray-600"
          />
          <button
            onClick={onImageRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            title="画像を削除"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ドラッグ&ドロップエリア */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  )
}
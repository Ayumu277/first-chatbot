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

    // ファイルサイズ制限（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。')
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
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors border border-gray-600 hover:border-gray-500"
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
import { useState, useCallback } from 'react'
import { UploadedImage } from '../types/chat'

export const useChatInput = () => {
  const [inputMessage, setInputMessage] = useState('')
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleImageUpload = useCallback((image: UploadedImage) => {
    setUploadedImage(image)
  }, [])

  const handleImageRemove = useCallback(() => {
    setUploadedImage(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]
          handleImageUpload({
            file,
            base64: base64Data,
            preview: base64,
            mimeType: file.type
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }, [handleImageUpload])

  const clearInput = useCallback(() => {
    setInputMessage('')
    setUploadedImage(null)
  }, [])

  return {
    inputMessage,
    setInputMessage,
    uploadedImage,
    isDragOver,
    handleImageUpload,
    handleImageRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearInput
  }
}
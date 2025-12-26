'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateProductImage } from '@/actions/inventory'
import { toast } from 'sonner'
import Image from 'next/image'

interface ProductImageCellProps {
    id: string
    initialImageUrl?: string | null
    name: string
}

export function ProductImageCell({ id, initialImageUrl, name }: ProductImageCellProps) {
    const [imageUrl, setImageUrl] = useState(initialImageUrl)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new window.Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 800
                const MAX_HEIGHT = 800
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                // Compress to JPEG 0.7
                const base64 = canvas.toDataURL('image/jpeg', 0.7)
                uploadImage(base64)
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    const uploadImage = async (base64: string) => {
        const result = await updateProductImage(id, base64)
        setLoading(false)
        if (result.success) {
            setImageUrl(base64)
            toast.success("Imagen actualizada")
        } else {
            toast.error("Error al guardar la imagen")
        }
    }

    return (
        <div className="flex items-center justify-center">
            <div
                className="relative h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden cursor-pointer group hover:border-slate-300 transition-colors"
                onClick={handleUploadClick}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300 group-hover:text-slate-400">
                        <ImageIcon className="h-5 w-5" />
                    </div>
                )}

                {/* Overlay for hover/loading */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                        <Camera className="h-4 w-4 text-white" />
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}

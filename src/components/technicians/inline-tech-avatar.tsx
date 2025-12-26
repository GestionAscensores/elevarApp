'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, User, X } from 'lucide-react'
import { updateTechnicianAvatar, deleteTechnicianAvatar } from '@/actions/technicians'
import { toast } from 'sonner'

interface Props {
    id: string
    initialImageUrl?: string | null
    name: string
}

export function InlineTechAvatar({ id, initialImageUrl, name }: Props) {
    const [imageUrl, setImageUrl] = useState(initialImageUrl)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("¿Eliminar foto?")) return

        setLoading(true)
        const result = await deleteTechnicianAvatar(id)
        setLoading(false)
        if (result.success) {
            setImageUrl(null)
            toast.success("Foto eliminada")
        } else {
            toast.error("Error al eliminar")
        }
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
                const MAX_WIDTH = 500 // Smaller for avatars
                const MAX_HEIGHT = 500
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

                const base64 = canvas.toDataURL('image/jpeg', 0.7)
                uploadImage(base64)
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    const uploadImage = async (base64: string) => {
        const result = await updateTechnicianAvatar(id, base64)
        setLoading(false)
        if (result.success) {
            setImageUrl(base64)
            toast.success("Foto actualizada")
        } else {
            toast.error("Error al guardar la foto")
        }
    }

    return (
        <div className="relative group cursor-pointer" onClick={handleUploadClick}>
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <User className="h-5 w-5 text-gray-400" />
                )}
            </div>

            {/* Hover overlay for upload */}
            <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity pointer-events-none ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {loading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                    <Camera className="h-4 w-4 text-white" />
                )}
            </div>

            {/* Delete Button (Visible on Hover if image exists) */}
            {imageUrl && !loading && (
                <div
                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    onClick={handleDeleteClick}
                    title="Eliminar foto"
                >
                    <X className="h-3 w-3" />
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    )
}

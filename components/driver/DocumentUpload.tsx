'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiUpload, FiCheck, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { supabase } from '@/lib/supabase' // Make sure your supabase client is here
import { useAuth } from '@/hooks/useAuth' // To get the driver's user ID

/* =========================
   Types
========================= */

type DocumentType =
  | 'licenseDocument'
  | 'insuranceDocument'
  | 'registrationDocument'

interface UploadedDocument {
  fileName: string
  uploadedAt: string
  verified: boolean
  url?: string // Added to store the Supabase URL
}

interface DocumentUploadProps {
  initialData?: Partial<Record<DocumentType, UploadedDocument>>
  onSuccess: (data: Record<DocumentType, UploadedDocument | null>) => void
  onBack?: () => void
  isInitialSetup?: boolean
}

/* =========================
   Component
========================= */

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  initialData,
  onSuccess,
  onBack,
  isInitialSetup
}) => {
  const { user } = useAuth() // Get current logged-in driver's info
  const [isLoading, setIsLoading] = useState(false)

  const [documents, setDocuments] = useState<
    Record<DocumentType, UploadedDocument | null>
  >({
    licenseDocument: initialData?.licenseDocument || null,
    insuranceDocument: initialData?.insuranceDocument || null,
    registrationDocument: initialData?.registrationDocument || null,
  })

  const canContinue = documents.licenseDocument !== null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: DocumentType
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and image files allowed')
      return
    }

    try {
      setIsLoading(true)

      // 1. Define file path: documents/USER_ID/DOCUMENT_TYPE_TIMESTAMP.ext
      const fileExt = file.name.split('.').pop()
      const fileName = `${documentType}_${Date.now()}.${fileExt}`
      const filePath = `documents/${user?.id || 'anonymous'}/${fileName}`

      // 2. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('oniva-image') // Using your actual bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 3. Get the Public URL from Supabase
      const { data: { publicUrl } } = supabase.storage
        .from('oniva-image')
        .getPublicUrl(filePath)

      const docData: UploadedDocument = {
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        verified: false,
        url: publicUrl // This is the URL we'll eventually save in Postgres
      }

      const updatedDocs = {
        ...documents,
        [documentType]: docData,
      }
      
      setDocuments(updatedDocs)
      toast.success(`${documentType.replace('Document', '')} uploaded successfully`)
      
      // If we're just editing one field, fire success immediately
      if (!isInitialSetup) {
        onSuccess(updatedDocs)
      }
    } catch (error: any) {
      console.error("Upload Error:", error)
      toast.error(error.message || 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  const DocumentCard = ({ title, type, desc }: { title: string, type: DocumentType, desc: string }) => {
    const doc = documents[type]
    return (
      <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-white shadow-sm">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mb-4">{desc}</p>
        
        {doc ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-blue-900 truncate">{doc.fileName}</p>
              <span className="text-[10px] text-blue-600">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
            </div>
            <FiCheck className="text-blue-600 flex-shrink-0 ml-2" />
          </div>
        ) : (
          <label className="cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, type)} 
              disabled={isLoading} 
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition">
              <FiUpload className="text-gray-400 mb-1 w-6 h-6" />
              <span className="text-sm text-gray-600">{isLoading ? 'Uploading...' : 'Click to Upload'}</span>
            </div>
          </label>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentCard title="License" type="licenseDocument" desc="Front side of your DL" />
        <DocumentCard title="Insurance" type="insuranceDocument" desc="Valid vehicle insurance" />
        <DocumentCard title="Registration" type="registrationDocument" desc="Proof of ownership" />
      </div>

      {isInitialSetup && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          
          <button
            type="button"
            disabled={!canContinue || isLoading}
            onClick={() => onSuccess(documents)}
            className={`flex items-center px-8 py-2.5 rounded-lg font-bold transition ${
              canContinue && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next Step <FiArrowRight className="ml-2" />
          </button>
        </div>
      )}
    </div>
  )
}
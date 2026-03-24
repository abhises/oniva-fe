'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiUpload, FiCheck, FiArrowLeft, FiArrowRight, FiFileText, FiCamera } from 'react-icons/fi'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/services/api'

/* =========================
   Types
========================= */

// Step 1: Added 'profilePhoto' to the type definition
type DocumentType = 'nationalId' | 'drivingLicense' | 'profilePhoto'

interface UploadedDocument {
  fileName: string
  uploadedAt: string
  verified: boolean
  url: string 
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
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // Step 2: Added profilePhoto to the initial state
  const [documents, setDocuments] = useState<Record<DocumentType, UploadedDocument | null>>({
    nationalId: initialData?.nationalId || null,
    drivingLicense: initialData?.drivingLicense || null,
    profilePhoto: initialData?.profilePhoto || null,
  })

  // Step 3: Updated validation to require all 3 items
  const canContinue = 
    documents.nationalId !== null && 
    documents.drivingLicense !== null && 
    documents.profilePhoto !== null;

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
      setIsLoading(documentType)

      const fileExt = file.name.split('.').pop()
      const fileName = `${documentType}_${Date.now()}.${fileExt}`
      
      // Keep profile photos in a separate folder within the bucket for better organization
      const folder = documentType === 'profilePhoto' ? 'profiles' : 'documents'
      const filePath = `${folder}/${user?.id || 'anonymous'}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('oniva-image')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('oniva-image')
        .getPublicUrl(filePath)

      const docData: UploadedDocument = {
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        verified: false,
        url: publicUrl 
      }

      const updatedDocs = { ...documents, [documentType]: docData }
      setDocuments(updatedDocs)
      
      const friendlyName = documentType === 'profilePhoto' ? 'Profile Photo' : 
                           documentType === 'nationalId' ? 'National ID' : 'Driving License'
      
      toast.success(`${friendlyName} uploaded`)
      
      if (!isInitialSetup) {
          const updatePayload: any = {};
          if (documentType === 'profilePhoto') updatePayload.profilePhoto = publicUrl;
          if (documentType === 'nationalId') updatePayload.nationalIdUrl = publicUrl;
          if (documentType === 'drivingLicense') updatePayload.drivingLicenseUrl = publicUrl;
          
          try {
             await apiClient.updateDriverProfile(updatePayload);
             onSuccess(updatedDocs);
          } catch(e) {
             toast.error('Failed to save document to profile in database');
          }
      }
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setIsLoading(null)
    }
  }

  const DocumentCard = ({ title, type, desc, icon: Icon }: { title: string, type: DocumentType, desc: string, icon: any }) => {
    const doc = documents[type]
    const isThisLoading = isLoading === type

    return (
      <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-all bg-white shadow-sm flex flex-col h-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-tight">{title}</h3>
            <p className="text-[11px] text-gray-500">{desc}</p>
          </div>
        </div>
        
        <div className="mt-auto">
          {doc ? (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="overflow-hidden flex items-center space-x-3">
                {type === 'profilePhoto' && (
                   <img src={doc.url} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-green-200" />
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-green-900 truncate max-w-[120px]">{doc.fileName}</p>
                  <span className="text-[10px] text-green-600 uppercase font-bold">Ready</span>
                </div>
              </div>
              <FiCheck className="text-green-600 flex-shrink-0 ml-2" />
            </div>
          ) : (
            <label className={`cursor-pointer block ${isThisLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, type)} 
                disabled={!!isLoading} 
                accept={type === 'profilePhoto' ? "image/*" : ".pdf,.jpg,.jpeg,.png"}
              />
              <div className="border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-blue-400 transition-all">
                <FiUpload className={`mb-2 w-5 h-5 ${isThisLoading ? 'animate-bounce text-blue-500' : 'text-gray-400'}`} />
                <span className="text-[10px] font-bold text-gray-600 uppercase">
                  {isThisLoading ? 'Uploading...' : `Upload ${title}`}
                </span>
              </div>
            </label>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 4: Updated Grid to handle 3 items nicely */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentCard 
          title="Profile Photo" 
          type="profilePhoto" 
          icon={FiCamera}
          desc="Clear headshot photo" 
        />
        <DocumentCard 
          title="National ID" 
          type="nationalId" 
          icon={FiFileText}
          desc="CNI scan or photo" 
        />
        <DocumentCard 
          title="Driving License" 
          type="drivingLicense" 
          icon={FiFileText}
          desc="Front side of license" 
        />
      </div>

      {isInitialSetup && (
        <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-900 font-bold text-sm transition"
          >
            <FiArrowLeft className="mr-2" /> PREVIOUS
          </button>
          
          <button
            type="button"
            disabled={!canContinue || !!isLoading}
            onClick={() => onSuccess(documents)}
            className={`flex items-center px-10 py-3 rounded-xl font-bold transition shadow-lg ${
              canContinue && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            NEXT STEP <FiArrowRight className="ml-2" />
          </button>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiUpload, FiCheck, FiAlertCircle } from 'react-icons/fi'

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
}

interface DocumentUploadProps {
  initialData?: Partial<Record<DocumentType, UploadedDocument>>
  onSuccess: () => void
}

interface DocumentCardProps {
  title: string
  documentType: DocumentType
  description: string
}

/* =========================
   Component
========================= */

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  initialData,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const [documents, setDocuments] = useState<
    Record<DocumentType, UploadedDocument | null>
  >({
    licenseDocument: initialData?.licenseDocument || null,
    insuranceDocument: initialData?.insuranceDocument || null,
    registrationDocument: initialData?.registrationDocument || null,
  })

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setIsLoading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const response = await fetch('/api/driver/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data: { document: UploadedDocument } = await response.json()

      setDocuments((prev) => ({
        ...prev,
        [documentType]: data.document,
      }))

      toast.success('Document uploaded')
      onSuccess()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Upload failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const DocumentCard: React.FC<DocumentCardProps> = ({
    title,
    documentType,
    description,
  }) => {
    const doc = documents[documentType]

    return (
      <div className="border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>

        {doc ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-900">
                  {doc.fileName}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              {doc.verified ? (
                <div className="flex items-center text-green-600">
                  <FiCheck className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <FiAlertCircle className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">
                    Pending
                  </span>
                </div>
              )}
            </div>

            <label>
              <input
                type="file"
                onChange={(e) =>
                  handleFileUpload(e, documentType)
                }
                disabled={isLoading}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <span className="cursor-pointer inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                Update
              </span>
            </label>
          </div>
        ) : (
          <label>
            <input
              type="file"
              onChange={(e) =>
                handleFileUpload(e, documentType)
              }
              disabled={isLoading}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500">
              <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900">
                {isLoading ? 'Uploading...' : 'Click to upload'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PDF or image up to 5MB
              </p>
            </div>
          </label>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentCard
          title="Driving License"
          documentType="licenseDocument"
          description="Upload your valid driving license"
        />

        <DocumentCard
          title="Insurance"
          documentType="insuranceDocument"
          description="Upload your vehicle insurance"
        />

        <DocumentCard
          title="Registration"
          documentType="registrationDocument"
          description="Upload vehicle registration"
        />
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> All documents will be verified by our team.
        </p>
      </div>
    </div>
  )
}

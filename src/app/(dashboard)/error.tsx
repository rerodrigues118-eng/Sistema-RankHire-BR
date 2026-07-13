'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error.message)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
      <div className="max-w-md w-full">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Algo deu errado
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {error.message || 'Erro inesperado. Tente novamente.'}
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-xs font-mono break-words">
            {error.digest && `Erro ID: ${error.digest}`}
          </p>
        </div>
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

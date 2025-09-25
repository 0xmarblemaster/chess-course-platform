'use client'

interface PDFDownloadButtonProps {
  pdfUrl: string
  levelTitle: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
}

export default function PDFDownloadButton({
  pdfUrl,
  levelTitle,
  size = 'md',
  variant = 'outline',
  className = ''
}: PDFDownloadButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
  }

  const handleDownload = () => {
    // Open PDF in new tab
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleDownload}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        font-medium rounded-md transition-colors
        flex items-center space-x-2
        ${className}
      `}
    >
      <span>📄</span>
      <span>Download {levelTitle} PDF</span>
    </button>
  )
}
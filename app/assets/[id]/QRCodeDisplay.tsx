'use client'

import { useState, useEffect } from 'react'

interface QRCodeDisplayProps {
  qrCode: string
  assetName: string
}

export default function QRCodeDisplay({ qrCode, assetName }: QRCodeDisplayProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // สร้าง URL สำหรับ QR Code ที่จะพาไปหน้า detail
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrCodeUrl(`${window.location.origin}/scan/${encodeURIComponent(qrCode)}`)
    } else {
      setQrCodeUrl(`/scan/${encodeURIComponent(qrCode)}`)
    }
  }, [qrCode])

  const qrCodeImageUrl = qrCodeUrl ? `/api/qrcode?text=${encodeURIComponent(qrCodeUrl)}` : ''

  const handlePrint = () => {
    if (!qrCodeImageUrl) return
    setIsPrinting(true)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${assetName}</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
              }
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px;
              }
              .qr-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .qr-image {
                border: 2px solid #000;
                padding: 20px;
                background: white;
              }
              .qr-text {
                font-size: 18px;
                font-weight: bold;
                margin-top: 10px;
              }
              .asset-name {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="asset-name">${assetName}</div>
              <div class="qr-image">
                <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 300px; height: 300px;" />
              </div>
              <div class="qr-text">${qrCode}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
      setIsPrinting(false)
    }
  }

  const handleDownload = () => {
    if (!qrCodeImageUrl) return
    const link = document.createElement('a')
    link.href = qrCodeImageUrl
    link.download = `QRCode-${qrCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-app-card rounded-lg border border-app p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-app-heading">QR Code</h3>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={!qrCodeImageUrl}
            className="px-4 py-2 text-sm font-medium text-app-body bg-app-card border border-app rounded-md hover:bg-app-section transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ดาวน์โหลด
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting || !qrCodeImageUrl}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? 'กำลังพิมพ์...' : 'พิมพ์'}
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        {qrCodeImageUrl && (
          <div className="flex flex-col items-center gap-2">
            <div className="border-[3px] border-black p-4 bg-white rounded-lg">
              <img
                src={qrCodeImageUrl}
                alt={`QR Code for ${qrCode}`}
                className="w-64 h-64 mix-blend-multiply"
              />
            </div>
            <p className="text-sm font-mono text-app-heading font-medium tracking-wider">{qrCode}</p>
          </div>
        )}
        {!qrCodeImageUrl && (
          <p className="text-sm font-mono text-app-heading font-medium">{qrCode}</p>
        )}
        <p className="text-xs text-app-muted text-center">
          สแกน QR Code นี้เพื่อดูรายละเอียดทรัพย์สิน
        </p>
      </div>
    </div>
  )
}





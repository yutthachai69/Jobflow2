"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
    label: string;
    onSave: (signatureDataUrl: string | null) => void;
    initialDataUrl?: string | null;
}

export default function SignaturePad({ label, onSave, initialDataUrl }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        if (initialDataUrl && sigCanvas.current) {
            setTimeout(() => {
                sigCanvas.current?.fromDataURL(initialDataUrl);
                setIsEmpty(false);
            }, 0)
        }
    }, [initialDataUrl]);

    const handleClear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
        onSave(null);
    };

    const handleEndPosition = () => {
        setIsEmpty(false);
        if (sigCanvas.current) {
            // Save as standard Base64 PNG string
            const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
            onSave(dataUrl);
        }
    };

    return (
        <div className="flex flex-col space-y-2 border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                    ล้างลายเซ็น (Clear)
                </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded bg-white relative">
                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        className: "w-full h-40 md:h-64 rounded cursor-crosshair",
                    }}
                    onEnd={handleEndPosition}
                    backgroundColor="white"
                    penColor="black"
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm opacity-50">
                        เซ็นชื่อที่นี่...
                    </div>
                )}
            </div>
        </div>
    );
}

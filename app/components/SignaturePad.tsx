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
            const rawCanvas = sigCanvas.current.getCanvas();
            const copy = document.createElement("canvas");
            copy.width = rawCanvas.width;
            copy.height = rawCanvas.height;
            const ctx = copy.getContext("2d");
            if (ctx) {
                ctx.drawImage(rawCanvas, 0, 0);
                const trimmedCanvas = trimCanvas(copy);
                const dataUrl = trimmedCanvas.toDataURL("image/png");
                onSave(dataUrl);
            } else {
                const dataUrl = rawCanvas.toDataURL("image/png");
                onSave(dataUrl);
            }
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

function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const context = canvas.getContext("2d");
    if (!context) return canvas;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgData = context.getImageData(0, 0, imgWidth, imgHeight).data;

    const scanY = (fromTop: boolean): number | null => {
        const offset = fromTop ? 1 : -1;
        const firstCol = fromTop ? 0 : imgHeight - 1;

        for (let y = firstCol; fromTop ? y < imgHeight : y > -1; y += offset) {
            for (let x = 0; x < imgWidth; x++) {
                if (imgData[(imgWidth * y + x) * 4 + 3]) {
                    return y;
                }
            }
        }
        return null;
    };

    const scanX = (fromLeft: boolean): number | null => {
        const offset = fromLeft ? 1 : -1;
        const firstRow = fromLeft ? 0 : imgWidth - 1;

        for (let x = firstRow; fromLeft ? x < imgWidth : x > -1; x += offset) {
            for (let y = 0; y < imgHeight; y++) {
                if (imgData[(imgWidth * y + x) * 4 + 3]) {
                    return x;
                }
            }
        }
        return null;
    };

    const cropTop = scanY(true);
    const cropBottom = scanY(false);
    const cropLeft = scanX(true);
    const cropRight = scanX(false);

    if (cropTop === null || cropBottom === null || cropLeft === null || cropRight === null) {
        return canvas;
    }

    const cropXDiff = cropRight - cropLeft + 1;
    const cropYDiff = cropBottom - cropTop + 1;

    const trimmedData = context.getImageData(cropLeft, cropTop, cropXDiff, cropYDiff);

    canvas.width = cropXDiff;
    canvas.height = cropYDiff;
    context.clearRect(0, 0, cropXDiff, cropYDiff);
    context.putImageData(trimmedData, 0, 0);

    return canvas;
}


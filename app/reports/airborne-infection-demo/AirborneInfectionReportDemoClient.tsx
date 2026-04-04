"use client";

import React, { useState } from "react";
import Link from "next/link";
import AirborneInfectionReport from "@/app/components/reports/AirborneInfectionReport";

export default function AirborneInfectionReportDemoClient({ jobItem }: { jobItem: any }) {
    const [savedDataUrl, setSavedDataUrl] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow relative z-10 print:hidden">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <span>📄</span>
                            Demo: Airborne Infection Control Room Report Template
                        </h1>
                        <Link href="/" className="text-gray-500 hover:text-gray-900">
                            กลับหน้าแรก
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {/* Render the actual report component passing the mock jobItem we created */}
                <AirborneInfectionReport jobItem={jobItem} />
            </main>
        </div>
    );
}

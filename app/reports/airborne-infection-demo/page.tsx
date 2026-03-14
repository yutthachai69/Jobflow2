import { prisma } from "@/lib/prisma";
import AirborneInfectionReportDemoClient from "./AirborneInfectionReportDemoClient";
import { notFound } from "next/navigation";

export default async function AirborneInfectionDemoPage() {
    // Find ANY JobItem to use as a base structure for the PDF template,
    // preferably a PM one, but any will do.
    let jobItem = await prisma.jobItem.findFirst({
        where: {
            workOrder: { jobType: "PM" }
        },
        orderBy: {
            id: "desc"
        },
        include: {
            asset: {
                include: {
                    room: true,
                },
            },
            workOrder: {
                include: {
                    site: {
                        include: {
                            client: true,
                        },
                    },
                },
            },
            technician: true,
        },
    });

    if (!jobItem) {
        // Fallback to searching ANY job item if no PM jobs exist
        jobItem = await prisma.jobItem.findFirst({
            include: {
                asset: { include: { room: true } },
                workOrder: { include: { site: { include: { client: true } } } },
                technician: true,
            }
        });
    }

    if (!jobItem) {
        // Ultimate fallback if the database is literally 100% empty
        console.log("No job items found at all, using completely mocked data for demo.");
    }

    // Convert to strict plain object to avoid Next.js RSC serialization issues
    // If jobItem is null (empty DB), provide a safe mock structure
    const plainJobItem = jobItem ? JSON.parse(JSON.stringify(jobItem)) : {
        asset: { name: "Demo AC Unit", qrCode: "AC-DEMO-001", room: { name: "Demo Room" } },
        workOrder: { 
            scheduledDate: new Date().toISOString(), 
            site: { name: "Demo Site", client: { name: "Demo Client Co.,Ltd." } } 
        },
        checklist: ""
    };
    
    // Inject mock Airborne Infection data to ensure the template visualizes properly
    plainJobItem.checklist = JSON.stringify({
        formType: 'AIRBORNE_INFECTION',
        data: {
            roomTempStr: "22", roomHumidityStr: "55", airChangeAch: "15", pm25: "10", co2Ppm: "400", soundLevelDb: "45", airFlowCfm: "1200",
            compL1: "5.2", compL2: "5.1", compL3: "5.0", motorAirL1: "12.5", motorAirL2: "12.4", motorAirL3: "12.6",
            sensorControlRoom: "normal", roomThermostat: "normal", coolingCoil: "normal", motorCooling: "normal", coilYen: "normal", drainPipe: "abnormal", airFilter: "normal", twoWayValve: "normal", waterPipeInsulation: "normal", chillerPipe: "normal", boardControlCoilYen: "normal", condensingCoil: "normal", magneticOverload: "normal", motorCondensing: "normal", compressorCheck: "normal", dischargePressure: "250", suctionPressure: "70", saturateSuctionTemp: "10", refrigerantPipeInsulation: "normal", boardControlCoilRon: "normal",
            remarksDrainPipe: "มีน้ำหยดเล็กน้อย", remarksGeneral: "ตัวอย่างรายงานแสดงผลสำหรับ Demo",
            customerSignature: null, wardNurseSignature: null, serviceSignature: null
        }
    });

    return <AirborneInfectionReportDemoClient jobItem={plainJobItem} />;
}

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditAssetForm from "./EditAssetForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAssetPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Only ADMIN can edit assets
  if (user.role !== 'ADMIN') {
    redirect('/assets');
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          floor: {
            include: {
              building: {
                include: {
                  site: {
                    include: {
                      client: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  // Get all sites for form
  const sites = await prisma.site.findMany({
    include: {
      client: true,
      buildings: {
        include: {
          floors: {
            include: {
              rooms: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href={`/assets/${id}`} 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 group transition-all duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          <span className="font-medium">กลับไปหน้ารายละเอียด</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แก้ไขข้อมูลแอร์</h1>
          <p className="text-gray-600">อัพเดทข้อมูลเครื่องปรับอากาศ</p>
        </div>

        <EditAssetForm asset={asset} sites={sites} />
      </div>
    </div>
  );
}


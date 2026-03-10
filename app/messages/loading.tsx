import TableSkeleton from "@/app/components/TableSkeleton";

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-full">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  );
}




import TableSkeleton from '@/app/components/TableSkeleton'

export default function ReportsLoading() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-6 w-48 bg-app-card rounded mb-4" />
        <div className="h-8 w-64 bg-app-card rounded mb-2" />
        <div className="h-4 w-48 bg-app-card rounded mb-8" />
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  )
}

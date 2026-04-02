export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 z-50">
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-dashed border-green-400"></div>
      <p className="mt-4 text-sm sm:text-base text-gray-600 text-center px-4 font-medium">
        Loading dashboard...
      </p>
    </div>
  );
}
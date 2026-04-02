interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-dashed border-green-400"></div>
      <p className="mt-4 text-sm sm:text-base text-black text-center px-4 font-medium">{message}</p>
    </div>
  );
}

//After account creation, and then manually test everything.
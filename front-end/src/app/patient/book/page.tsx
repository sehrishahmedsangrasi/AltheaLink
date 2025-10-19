// app/patient/book/page.tsx
import { Suspense } from "react";
import BookPageContent from "./BookPageContent";

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E1E9F1' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5DC4C7] mx-auto mb-4"></div>
          <p style={{ color: '#06434D' }}>Loading...</p>
        </div>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoSession } from '@/lib/auth';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getDemoSession();
    if (session && session.phone) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-3">
      <div className="w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-xs font-semibold">Initializing NE-SHIELD Crowd...</p>
    </div>
  );
}

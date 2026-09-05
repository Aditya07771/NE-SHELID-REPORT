'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoSession } from '@/lib/auth';
import { useI18n } from '@/i18n/LanguageProvider';

export default function IndexPage() {
  const router = useRouter();
  const { t } = useI18n();

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
      <p className="text-gray-500 text-xs font-semibold">{t('common.initializing')}</p>
    </div>
  );
}

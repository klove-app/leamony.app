import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ClientDashboard from '@/components/ClientDashboard';
import ClientWrapper from '@/components/ClientWrapper';

export default function Dashboard() {
  const router = useRouter();

  return (
    <ClientWrapper requireAuth>
      <ClientDashboard />
    </ClientWrapper>
  );
} 
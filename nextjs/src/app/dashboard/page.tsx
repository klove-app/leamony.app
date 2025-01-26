import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import ClientDashboard from '@/components/ClientDashboard';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return <ClientDashboard user={user} />;
} 
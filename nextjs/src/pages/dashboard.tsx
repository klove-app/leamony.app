import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getUser } from '@/lib/auth';
import ClientDashboard from '@/components/ClientDashboard';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { user },
  };
};

interface DashboardProps {
  user: any; // TODO: добавить правильный тип
}

export default function Dashboard({ user }: DashboardProps) {
  return <ClientDashboard user={user} />;
} 
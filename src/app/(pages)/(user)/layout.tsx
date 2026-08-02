import MainLayout from '@/app/components/layout/MainLayout';


export default function UserGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}

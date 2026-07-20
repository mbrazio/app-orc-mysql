import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { DashboardClientLayout } from '@/components/dashboard-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardClientLayout userEmail={user.email} userName={user.name}>
      {children}
    </DashboardClientLayout>
  )
}

'use client'

import { ReactNode, Suspense } from 'react'
import DashboardLayout from './DashboardLayout'

interface DashboardLayoutWrapperProps {
  children: ReactNode
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </Suspense>
  )
} 
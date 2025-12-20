import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Pricing } from '@/components/landing/pricing'
import { Footer } from '@/components/landing/footer'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  // Optional: If user is already logged in, redirect to dashboard?
  // Or just show "Go to Dashboard" button in Navbar.
  // For now, let's allow them to see the landing page but Navbar will handle links.
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  )
}

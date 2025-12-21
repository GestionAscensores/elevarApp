import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronRight, Zap, Building2, ShieldCheck, Mail, Users, ArrowRight, BarChart3, Edit, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground scroll-smooth">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Building2 className="h-6 w-6 text-primary" />
            <span>ELEVAR APP</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Precios</Link>
            <Link href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contacto</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hover:bg-primary/5">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="hidden sm:flex shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90">Prueba Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 border-b bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
          <div className="container flex flex-col items-center text-center max-w-5xl mx-auto px-4 relative z-10">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors border-primary/20 bg-primary/10 text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Sparkles className="mr-2 h-4 w-4" />
              Nuevo: Salud Fiscal para Monotributistas 📊
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 leading-tight">
              Tu Empresa de Ascensores,<br />
              <span className="text-primary">Administrada en Piloto Automático.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Desde la facturación masiva de abonos hasta el control de categorías de AFIP. Todo lo que necesitás para dejar de perder tiempo en papeles y empezar a crecer.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg w-full sm:w-auto shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 rounded-full">
                  Empezar Prueba Gratis
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg w-full sm:w-auto rounded-full border-2 hover:bg-muted/50">
                  Ver Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground font-medium">
              🔒 Sin tarjeta de crédito requerida • 15 días de prueba full
            </p>
          </div>

          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/20" id="features">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Más que una planilla de cálculo</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Diseñamos cada herramienta pensando en los problemas reales de los mantenedores.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-orange-500" />}
                title="Facturación Recurrente"
                description="Programá tus abonos y olvidate. El sistema genera los borradores mensuales automáticamente (mes vencido o en curso)."
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
                title="Salud de Monotributo"
                description="Semáforo fiscal en tiempo real. Controlá tu facturación de los últimos 12 meses y recibí alertas antes de exceder tu categoría."
              />
              <FeatureCard
                icon={<Edit className="h-8 w-8 text-green-500" />}
                title="Gestión Rápida"
                description="Edición 'Inline' de Clientes y Precios. Modificá direcciones, montos de abono y nombres sin entrar en formularios lentos."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8 text-purple-500" />}
                title="Base Unificada"
                description="Administraciones, Consorcios y Particulares en un solo lugar. Importación masiva desde Excel para empezar en minutos."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-indigo-500" />}
                title="Integración AFIP"
                description="Facturas A, B y C autorizadas al instante con CAE y QR. Certificados digitales gestionados en la nube."
              />
              <FeatureCard
                icon={<Mail className="h-8 w-8 text-pink-500" />}
                title="Envío Automático"
                description="Enviá los comprobantes por email a tus clientes con un solo clic y verificá quiénes los recibieron."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 relative" id="pricing">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background -z-10" />
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">Precio Simple y Transparente</h2>
              <p className="text-lg text-muted-foreground">
                Sin comisiones por factura ni costos ocultos.
              </p>
            </div>

            <div className="mx-auto max-w-md">
              <div className="relative rounded-3xl border bg-background p-8 shadow-2xl hover:shadow-primary/20 transition-all duration-300 ring-1 ring-primary/10">
                <div className="absolute -top-5 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground shadow-lg">
                  OFERTA LANZAMIENTO
                </div>
                <div className="text-center space-y-4 mb-8">
                  <h3 className="text-2xl font-bold text-muted-foreground line-through decoration-red-500 decoration-2 opacity-70">
                    $25.000 / mes
                  </h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-6xl font-extrabold tracking-tight">$15.000</span>
                    <span className="text-xl font-medium text-muted-foreground self-end mb-2">/mes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Precio final, para siempre.</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Usuarios ilimitados",
                    "Facturas ilimitadas",
                    "Clientes ilimitados",
                    "Soporte prioritario por WhatsApp",
                    "Actualizaciones gratuitas"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href="/register">
                    <Button size="lg" variant="default">
                      Crear Cuenta Gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <Link href="/register">
                  <Button className="w-full h-12 text-lg font-bold shadow-lg" size="lg">
                    Aprovechar Oferta Ahora
                  </Button>
                </Link>
                <p className="mt-4 text-xs text-center text-muted-foreground">
                  Garantía de satisfacción de 30 días.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-8">
              Empieza hoy tu transformación digital
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
              Tus competidores ya están automatizando. No te quedes atrás gestionando papeles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all w-full sm:w-auto">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container py-12 px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              <span>ELEVAR APP</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2024 Elevar App. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Términos</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacidad</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Soporte</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-muted/50 p-3 group-hover:bg-primary/5 transition-colors">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

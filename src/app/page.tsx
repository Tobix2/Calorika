
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, BarChart, Briefcase } from 'lucide-react';
import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800 font-body">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-background to-white pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-headline text-foreground leading-tight">
                Transforma tu cuerpo, potencia tu vida.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
                Calorika te guía con planes de nutrición inteligentes para que alcances tus metas sin esfuerzo.
              </p>
              <div className="mt-8 flex justify-center md:justify-start gap-4">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/login?view=register">Empieza Gratis</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#pricing">Ver Planes</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-96 md:h-auto">
                <Image
                    src="https://placehold.co/800x900.png"
                    alt="Calorika App Mockup"
                    width={800}
                    height={900}
                    priority
                    className="rounded-lg shadow-xl mx-auto"
                    data-ai-hint="mobile app mockup"
                />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-foreground">Todo lo que necesitas para triunfar</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestras herramientas están diseñadas para hacerte el camino más fácil y efectivo.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6">
                <BarChart className="h-12 w-12 text-primary mx-auto" />
                <h3 className="mt-4 text-xl font-bold">Planes a tu Medida</h3>
                <p className="mt-2 text-muted-foreground">Recibe un plan de calorías y macros calculado por nuestra IA para tus objetivos específicos.</p>
              </div>
              <div className="p-6">
                <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                <h3 className="mt-4 text-xl font-bold">Seguimiento sin Esfuerzo</h3>
                <p className="mt-2 text-muted-foreground">Registra tus comidas y tu peso en segundos y visualiza tu progreso en tiempo real.</p>
              </div>
              <div className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto" />
                <h3 className="mt-4 text-xl font-bold">Para Ti y tus Clientes</h3>
                <p className="mt-2 text-muted-foreground">Ideal para uso personal o para que nutricionistas y entrenadores gestionen a sus clientes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-foreground">Empieza en 3 simples pasos</h2>
            <div className="mt-12 grid md:grid-cols-3 gap-8 items-start text-center">
              <div>
                <Image src="https://placehold.co/600x400.png" alt="Paso 1" width={600} height={400} className="rounded-lg shadow-lg mx-auto" data-ai-hint="goal setting"/>
                <h3 className="text-xl font-bold mt-6">1. Elige tu objetivo</h3>
                <p className="mt-2 text-muted-foreground">Define si quieres perder peso, mantenerte o ganar masa muscular.</p>
              </div>
              <div>
                <Image src="https://placehold.co/600x400.png" alt="Paso 2" width={600} height={400} className="rounded-lg shadow-lg mx-auto" data-ai-hint="meal plan"/>
                <h3 className="text-xl font-bold mt-6">2. Recibe tu plan</h3>
                <p className="mt-2 text-muted-foreground">Nuestra IA crea un plan de comidas y macros personalizado para ti.</p>
              </div>
              <div>
                <Image src="https://placehold.co/600x400.png" alt="Paso 3" width={600} height={400} className="rounded-lg shadow-lg mx-auto" data-ai-hint="progress chart"/>
                <h3 className="text-xl font-bold mt-6">3. Ve resultados</h3>
                <p className="mt-2 text-muted-foreground">Sigue el plan, registra tu progreso y alcanza tus metas como nunca antes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-foreground text-center">Amado por miles de usuarios</h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg shadow-sm bg-gray-50">
                <p className="text-muted-foreground">"¡He perdido 10 kg en 3 meses! La app me lo hizo súper fácil. El plan personalizado fue la clave."</p>
                <div className="flex items-center mt-4">
                  <Image src="https://placehold.co/40x40.png" alt="User 1" width={40} height={40} className="rounded-full" data-ai-hint="person"/>
                  <div className="ml-4">
                    <p className="font-bold">Ana Pérez</p>
                    <p className="text-sm text-muted-foreground">Usuaria Satisfecha</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border rounded-lg shadow-sm bg-gray-50">
                <p className="text-muted-foreground">"Como entrenador, gestiono a más de 20 clientes con Calorika. Me ahorra horas de trabajo y ellos aman la interfaz."</p>
                <div className="flex items-center mt-4">
                  <Image src="https://placehold.co/40x40.png" alt="User 2" width={40} height={40} className="rounded-full" data-ai-hint="person"/>
                  <div className="ml-4">
                    <p className="font-bold">Carlos García</p>
                    <p className="text-sm text-muted-foreground">Entrenador Personal</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border rounded-lg shadow-sm bg-gray-50">
                <p className="text-muted-foreground">"Finalmente una app que entiende mis necesidades para el rendimiento deportivo. ¡Mis niveles de energía están por las nubes!"</p>
                <div className="flex items-center mt-4">
                  <Image src="https://placehold.co/40x40.png" alt="User 3" width={40} height={40} className="rounded-full" data-ai-hint="person"/>
                  <div className="ml-4">
                    <p className="font-bold">Laura Méndez</p>
                    <p className="text-sm text-muted-foreground">Deportista</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 sm:py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold font-headline text-foreground">Elige el plan perfecto para ti</h2>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    {/* Plan Gratis */}
                    <div className="border rounded-lg p-6 text-center flex flex-col">
                        <h3 className="text-2xl font-bold">Gratis</h3>
                        <p className="mt-4 text-4xl font-bold">$0<span className="text-lg font-medium text-muted-foreground">/mes</span></p>
                        <ul className="mt-6 space-y-4 text-left flex-grow">
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Cálculo de macros</li>
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Registro de comidas</li>
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Seguimiento de peso</li>
                        </ul>
                        <Button asChild variant="outline" className="mt-8 w-full">
                           <Link href="/login?view=register">Empieza Gratis</Link>
                        </Button>
                    </div>

                    {/* Plan Premium */}
                    <div className="border rounded-lg p-6 text-center flex flex-col">
                        <h3 className="text-2xl font-bold text-primary">Premium</h3>
                        <Tabs defaultValue="monthly" className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="monthly">Mensual</TabsTrigger>
                                <TabsTrigger value="annual">Anual</TabsTrigger>
                            </TabsList>
                            <TabsContent value="monthly">
                                <p className="mt-4 text-4xl font-bold">$10.000<span className="text-lg font-medium text-muted-foreground">/mes</span></p>
                            </TabsContent>
                            <TabsContent value="annual">
                               <p className="mt-4 text-4xl font-bold">$100.000<span className="text-lg font-medium text-muted-foreground">/año</span></p>
                               <p className="text-sm font-bold text-primary">¡Ahorra 2 meses!</p>
                            </TabsContent>
                        </Tabs>
                        <ul className="mt-6 space-y-4 text-left flex-grow">
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Todo lo del plan Gratis</li>
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Planes de comidas IA</li>
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Base de datos de recetas</li>
                            <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Soporte prioritario</li>
                        </ul>
                         <Button asChild className="mt-8 w-full">
                           <Link href="/login?plan=pro">Elegir Plan Premium</Link>
                         </Button>
                    </div>

                    {/* Plan Profesional */}
                    <div className="border rounded-lg p-6 text-center flex flex-col">
                         <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                           <Briefcase />
                           Profesional
                         </h3>
                        <div className="mt-4">
                           <p className="text-4xl font-bold">$5.000</p>
                           <p className="text-lg font-medium text-muted-foreground -mt-2">/por cliente al mes</p>
                        </div>

                        <ul className="mt-6 space-y-4 text-left flex-grow">
                           <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Todo lo del plan Premium</li>
                           <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Panel para gestionar clientes</li>
                           <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Branding personalizable (Próximamente)</li>
                           <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Gestiona todos tus clientes</li>
                        </ul>
                        <Button asChild variant="outline" className="mt-8 w-full">
                           <Link href="/login?plan=professional&view=register">Elegir Plan Profesional</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>


        {/* Final CTA */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-foreground">¿Listo para cambiar tu nutrición?</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Crea tu cuenta gratis y da el primer paso hacia una vida más saludable y llena de energía.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/login?view=register">Únete a Calorika Ahora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Calorika. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

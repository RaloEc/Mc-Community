import ForoSidebar from '@/components/foro/ForoSidebar'

export const revalidate = 0

function getBaseUrl() {
  // Si estamos en el navegador, usar la URL actual
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // En el servidor, intentar usar variables de entorno
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) return site
  
  const netlify = process.env.NETLIFY_URL
  if (netlify) return `https://${netlify}`
  
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  
  // Fallback para desarrollo local
  return 'http://localhost:3000'
}

async function getCategorias() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/foro/categorias`, { next: { revalidate: 0 } })
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export default async function ForoLayout({ children }: { children: React.ReactNode }) {
  const categorias = await getCategorias()
  return (
    <div className="bg-white dark:bg-gray-950 amoled:bg-black min-h-screen">
      <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <ForoSidebar categorias={categorias} />
          <main className="w-full lg:flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

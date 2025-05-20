import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">404 - Página No Encontrada</h2>
        <p className="text-gray-600 mb-6">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/">
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              Ir a Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

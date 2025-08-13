'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BotonVerMasProps {
  href: string;
  className?: string;
  iconOnly?: boolean;
}

export default function BotonVerMas({ href, className = '', iconOnly = false }: BotonVerMasProps) {
  return (
    <Link href={href} className={className}>
      <span className="inline-flex items-center text-sm font-medium text-primary">
        {!iconOnly && <span>Ver más</span>}
        <ArrowRight className="h-4 w-4 ml-1" />
      </span>
    </Link>
  );
}

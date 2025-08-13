'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BotonIconoProps {
  href: string;
  className?: string;
}

export default function BotonIcono({ href, className = '' }: BotonIconoProps) {
  return (
    <Link href={href} className={className}>
      <span className="inline-flex items-center text-sm font-medium text-primary">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

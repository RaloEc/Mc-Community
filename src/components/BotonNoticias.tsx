'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface BotonNoticiasProps {
  className?: string;
}

export default function BotonNoticias({ className = '' }: BotonNoticiasProps) {
  return (
    <Link href="/noticias" className={className}>
      <Button variant="outline" size="sm" className="flex items-center space-x-1 border-primary/30 text-primary hover:bg-primary/10">
        <span>Ver todas las noticias</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}

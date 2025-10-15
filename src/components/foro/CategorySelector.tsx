"use client";

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface Category {
  id: string;
  nombre: string;
  subcategories?: Category[];
  color?: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (category: Category) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySelectorProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isOpen = openCategories[category.id];
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="space-y-1">
        {hasSubcategories ? (
          <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category.id)}>
            <div className="flex items-center group">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6 mr-1 hover:bg-accent flex-shrink-0"
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              
              <Button
                variant="ghost"
                className={cn(
                  "justify-start p-2 h-auto w-full text-left hover:bg-accent/50 rounded-md transition-colors",
                  isSelected && "bg-accent text-accent-foreground font-medium"
                )}
                style={{ paddingLeft: `${level * 1.5}rem` }}
                onClick={() => onSelectCategory(category)}
              >
                <div className="flex items-center">
                  {category.color && (
                    <div
                      className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <span>{category.nombre}</span>
                </div>
              </Button>
            </div>

            <CollapsibleContent className="ml-6 pl-2 border-l-2 border-border/30 dark:border-border/50 space-y-1">
              {category.subcategories?.map((subcat) => renderCategory(subcat, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "justify-start p-2 h-auto w-full text-left hover:bg-accent/50 rounded-md transition-colors",
              isSelected && "bg-accent text-accent-foreground font-medium"
            )}
            style={{ paddingLeft: `${level * 1.5}rem` }}
            onClick={() => onSelectCategory(category)}
          >
            <div className="flex items-center">
              {category.color && (
                <div
                  className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <span>{category.nombre}</span>
            </div>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => renderCategory(category))}
    </div>
  );
}

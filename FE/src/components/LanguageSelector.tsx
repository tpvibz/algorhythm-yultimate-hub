import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, languages } = useLanguage();

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-accent"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block text-sm">
            {currentLanguage.nativeName || currentLanguage.name}
          </span>
          <span className="sm:hidden text-xs">
            {currentLanguage.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${
              language === lang.code ? 'bg-accent font-semibold' : ''
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span>{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {lang.name}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;


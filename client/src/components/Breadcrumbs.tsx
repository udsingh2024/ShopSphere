import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Suppress rendering on home layout
  if (pathnames.length === 0) return null;

  return (
    <nav className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        <li>
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayValue = decodeURIComponent(value).replace(/-/g, ' ');

          return (
            <li key={to} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 shrink-0" />
              {isLast ? (
                <span className="font-extrabold text-foreground truncate max-w-[150px]">{displayValue}</span>
              ) : (
                <Link to={to} className="hover:text-primary transition-colors truncate max-w-[150px]">
                  {displayValue}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

import type { ReactNode } from 'react';

interface RouteTransitionProps {
  children: ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  return (
    <div className="animate-fadeIn">
      {children}
    </div>
  );
}

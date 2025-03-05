declare module 'next/navigation' {
  export function usePathname(): string;
  export function useRouter(): {
    back: () => void;
    forward: () => void;
    refresh: () => void;
    push: (href: string) => void;
    replace: (href: string) => void;
    prefetch: (href: string) => void;
  };
  export function useSearchParams(): URLSearchParams;
  export function useParams(): Record<string, string | string[]>;
} 
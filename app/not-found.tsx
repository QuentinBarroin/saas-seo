import Link from 'next/link';
import { NvButton } from '@/components/nv';

export default function RootNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--nv-bg)] p-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-[14px] font-medium uppercase tracking-wide text-[var(--nv-text-muted)]">
          404
        </p>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--nv-navy)]">
          Page introuvable
        </h1>
        <p className="text-[14px] text-[var(--nv-text-muted)]">
          Cette URL n'existe pas. Connecte-toi pour accéder à l'app.
        </p>
        <NvButton asChild variant="primary" size="md">
          <Link href="/login">Aller à la connexion</Link>
        </NvButton>
      </div>
    </div>
  );
}

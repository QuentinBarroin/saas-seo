'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  NvButton,
  NvCard,
  NvModal,
  NvModalHeader,
  NvModalBody,
  NvModalFooter,
} from '@/components/nv';
import { deleteProjectAction } from './actions';

type DeleteButtonProps = {
  projectId: string;
  projectName: string;
};

export function DeleteButton({ projectId, projectName }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <NvCard>
        <div className="flex items-start justify-between gap-4 rounded-lg border-2 border-[var(--nv-danger-soft)] bg-[var(--nv-danger-soft)]/20 p-5">
          <div>
            <h2 className="mb-1 text-[16px] font-bold tracking-tight text-[var(--nv-navy)]">
              Zone de danger
            </h2>
            <p className="text-[13px] text-[var(--nv-text-muted)]">
              La suppression du projet est définitive et supprime tous les audits, findings et
              backlog associés.
            </p>
          </div>
          <NvButton type="button" variant="ghost" size="sm" onClick={() => setShowConfirm(true)}>
            <Trash2 size={14} strokeWidth={2} />
            Supprimer le projet
          </NvButton>
        </div>
      </NvCard>

      {showConfirm ? (
        <NvModal onClose={() => setShowConfirm(false)}>
          <NvModalHeader
            title="Confirmer la suppression"
            icon={<AlertTriangle size={20} className="text-[var(--nv-danger)]" />}
            onClose={() => setShowConfirm(false)}
          />
          <NvModalBody>
            <p className="text-[13px] text-[var(--nv-navy)]">
              Voulez-vous vraiment supprimer le projet <strong>{projectName}</strong> ?
            </p>
            <p className="mt-2 text-[13px] text-[var(--nv-text-muted)]">
              Cette action est irréversible. Tous les audits, findings, backlog et données
              associées seront définitivement supprimés.
            </p>
          </NvModalBody>
          <NvModalFooter>
            <NvButton type="button" variant="ghost" onClick={() => setShowConfirm(false)}>
              Annuler
            </NvButton>
            <form action={deleteProjectAction}>
              <input type="hidden" name="id" value={projectId} />
              <NvButton type="submit" variant="primary">
                <Trash2 size={14} strokeWidth={2} />
                Supprimer définitivement
              </NvButton>
            </form>
          </NvModalFooter>
        </NvModal>
      ) : null}
    </>
  );
}

import { ProjectForm } from '../project-form';
import { createProjectAction } from './actions';

export function NewProjectForm() {
  return (
    <ProjectForm
      mode="create"
      action={createProjectAction}
      submitLabel="Créer le projet"
      showSeedsAndCompetitors={true}
    />
  );
}

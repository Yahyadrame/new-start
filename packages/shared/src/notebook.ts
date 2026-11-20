import { z } from 'zod';

/** Une entrée du carnet, telle que `GET /notebook` la renvoie. */
export const NotebookEntryItem = z.object({
  id: z.string(),
  /** La phrase de la personne. */
  original: z.string(),
  /** La version « Plus naturel ». */
  better: z.string(),
  whyFr: z.string().nullable(),
  createdAt: z.string(),
});
export type NotebookEntryItem = z.infer<typeof NotebookEntryItem>;

/** Corps de `POST /notebook` : le message dont on garde la correction. */
export const AddNotebookEntry = z.object({ messageId: z.uuid() });
export type AddNotebookEntry = z.infer<typeof AddNotebookEntry>;

import { z } from 'zod';

/** Une notification, telle que `GET /notifications` la renvoie. */
export const NotificationItem = z.object({
  id: z.string(),
  /** Le type : aujourd'hui seulement « reminder ». */
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
});
export type NotificationItem = z.infer<typeof NotificationItem>;

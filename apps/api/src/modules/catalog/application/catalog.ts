import { HttpException } from '@nestjs/common';
import { isAdult } from '../../../shared/age.js';
import type { AgentCard, AgentsQuery, TopicItem } from '@newstart/shared';

export const CATALOG_STORE = Symbol('CATALOG_STORE');

export interface CatalogStore {
  birthYear(userId: string): Promise<number | null | undefined>;
  /** Les thèmes dans l'ordre d'affichage, avec leurs contacts actifs. `adultOnly` exclut les thèmes réservés aux majeurs. */
  topics(opts: { withAdult: boolean }): Promise<TopicItem[]>;
  /** Le thème demandé, ou null s'il n'existe pas. */
  topicAdultOnly(slug: string): Promise<boolean | null>;
  agents(opts: { withAdult: boolean } & AgentsQuery): Promise<AgentCard[]>;
}

export class CatalogService {
  constructor(
    private readonly store: CatalogStore,
    private readonly currentYear: () => number = () => new Date().getFullYear(),
  ) {}

  private async withAdult(userId: string) {
    return isAdult(await this.store.birthYear(userId), this.currentYear());
  }

  async topics(userId: string) {
    return this.store.topics({ withAdult: await this.withAdult(userId) });
  }

  async agents(userId: string, query: AgentsQuery) {
    const withAdult = await this.withAdult(userId);
    if (query.topic && !withAdult && (await this.store.topicAdultOnly(query.topic))) {
      throw new HttpException(
        { code: 'TOPIC_ADULT_ONLY', message: 'Ce thème est réservé aux personnes majeures.' },
        403,
      );
    }
    return this.store.agents({ withAdult, ...query });
  }
}

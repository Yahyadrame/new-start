import { Inject, Injectable } from '@nestjs/common';
import type { PlanItem } from '@newstart/shared';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { PlansStore } from '../application/plans.js';

@Injectable()
export class PrismaPlansStore implements PlansStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(currency: PlanItem['currency']): Promise<PlanItem[]> {
    const rows = await this.db.plan.findMany({
      orderBy: { position: 'asc' },
      include: { prices: { where: { currency } } },
    });
    // Une offre sans prix dans cette devise n'est pas proposée.
    return rows.flatMap(({ prices, code, nameFr, periodDays, renews }) =>
      prices[0]
        ? [{ code, nameFr, periodDays, renews, currency, amountMinor: prices[0].amountMinor }]
        : [],
    );
  }
}

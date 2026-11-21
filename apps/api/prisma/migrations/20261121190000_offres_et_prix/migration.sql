-- Étendre : deux nouvelles tables, aucune lecture ni écriture existante ne change.
CREATE TABLE "Plan" (
    "code" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "renews" BOOLEAN NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "PlanPrice" (
    "planCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("planCode","currency")
);

ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_planCode_fkey" FOREIGN KEY ("planCode") REFERENCES "Plan"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prix proposés de docs/14-paiements.md (à valider avec les 100 premiers utilisateurs).
INSERT INTO "Plan" ("code", "nameFr", "periodDays", "renews", "position") VALUES
  ('FREE', 'Gratuit', 0, false, 1),
  ('WEEK_PASS', 'Pass semaine', 7, false, 2),
  ('PLUS_MONTHLY', 'Plus mensuel', 30, true, 3),
  ('PLUS_YEARLY', 'Plus annuel', 365, true, 4),
  ('PRO_MONTHLY', 'Pro mensuel', 30, true, 5);

INSERT INTO "PlanPrice" ("planCode", "currency", "amountMinor") VALUES
  ('FREE', 'XOF', 0), ('FREE', 'USD', 0),
  ('WEEK_PASS', 'XOF', 500), ('WEEK_PASS', 'USD', 199),
  ('PLUS_MONTHLY', 'XOF', 2000), ('PLUS_MONTHLY', 'USD', 599),
  ('PLUS_YEARLY', 'XOF', 15000), ('PLUS_YEARLY', 'USD', 3999),
  ('PRO_MONTHLY', 'XOF', 4000), ('PRO_MONTHLY', 'USD', 1199);

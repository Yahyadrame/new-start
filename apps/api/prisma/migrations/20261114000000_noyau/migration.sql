-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Expression" (
    "id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "meaningFr" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "register" TEXT NOT NULL,
    "sceneType" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Expression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expression_text_key" ON "Expression"("text");

-- CreateIndex
CREATE UNIQUE INDEX "Word_text_key" ON "Word"("text");


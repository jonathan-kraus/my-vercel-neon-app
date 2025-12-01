/*
  Warnings:

  - You are about to alter the column `queryHash` on the `SlowQueryHistory` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(16)`.
  - A unique constraint covering the columns `[queryHash]` on the table `SlowQueryHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SlowQueryHistory" ALTER COLUMN "queryHash" SET DATA TYPE CHAR(16);

-- CreateIndex
CREATE UNIQUE INDEX "SlowQueryHistory_queryHash_key" ON "SlowQueryHistory"("queryHash");

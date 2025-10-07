/*
  Warnings:

  - The primary key for the `Log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Log` table. All the data in the column will be lost.
  - Added the required column `severity` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Log" DROP CONSTRAINT "Log_pkey",
DROP COLUMN "createdAt",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Log_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Log_id_seq";

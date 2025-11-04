-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "followUpNotes" TEXT,
ADD COLUMN     "needsFollowUp" BOOLEAN NOT NULL DEFAULT false;

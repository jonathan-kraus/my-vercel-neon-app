-- CreateTable
CREATE TABLE "SlowQueryHistory" (
    "id" SERIAL NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "meanTime" DOUBLE PRECISION,
    "calls" INTEGER,
    "durationMs" DOUBLE PRECISION,
    "source" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,

    CONSTRAINT "SlowQueryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlowQueryHistory_queryHash_timestamp_idx" ON "SlowQueryHistory"("queryHash", "timestamp");

-- CreateIndex
CREATE INDEX "SlowQueryHistory_timestamp_idx" ON "SlowQueryHistory"("timestamp");

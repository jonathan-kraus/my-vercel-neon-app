-- CreateTable
CREATE TABLE "WeatherHourly" (
    "id" SERIAL NOT NULL,
    "location" TEXT NOT NULL,
    "forecastTime" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windGust" DOUBLE PRECISION NOT NULL,
    "precipitationProbability" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION,
    "visibility" DOUBLE PRECISION,
    "weatherCode" INTEGER NOT NULL,
    "rainAccumulationAvg" DOUBLE PRECISION NOT NULL,
    "rainAccumulationMax" DOUBLE PRECISION NOT NULL,
    "rainAccumulationMin" DOUBLE PRECISION NOT NULL,
    "rainAccumulationSum" DOUBLE PRECISION NOT NULL,
    "locationDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherHourly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherHourly_location_forecastTime_idx" ON "WeatherHourly"("location", "forecastTime");

-- CreateIndex
CREATE INDEX "WeatherHourly_location_updatedAt_idx" ON "WeatherHourly"("location", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHourly_location_forecastTime_key" ON "WeatherHourly"("location", "forecastTime");

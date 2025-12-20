-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "excludeFromMassUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceUpdateFrequency" TEXT NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "previousPrice" DECIMAL(10,2) NOT NULL,
    "newPrice" DECIMAL(10,2) NOT NULL,
    "percentageChange" DECIMAL(5,2) NOT NULL,
    "month" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "isMassUpdate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceHistory_clientId_idx" ON "PriceHistory"("clientId");

-- CreateIndex
CREATE INDEX "PriceHistory_month_idx" ON "PriceHistory"("month");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

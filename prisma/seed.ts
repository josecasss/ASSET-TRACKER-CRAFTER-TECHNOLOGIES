import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const STATUS_CODES = [
  { statusId: '01', statusText: 'In Storage' },
  { statusId: '02', statusText: 'In Use' },
  { statusId: '03', statusText: 'In Transit' },
  { statusId: '04', statusText: 'Pending Count' },
  { statusId: '05', statusText: 'Under Repair' },
  { statusId: '06', statusText: 'Missing' },
  { statusId: '07', statusText: 'Retired' },
];

const ASSETS = [
  {
    companyCode: 'COMP',
    mainAssetNumber: '21000004',
    assetSubNumber: '00',
    description: 'Forklift - Warehouse A',
    costCenter: 'CC-1000',
    statusId: '01',
  },
  {
    companyCode: 'COMP',
    mainAssetNumber: '21000005',
    assetSubNumber: '00',
    description: 'Pallet Jack - Warehouse A',
    costCenter: 'CC-1000',
    statusId: '02',
  },
  {
    companyCode: 'OTHR',
    mainAssetNumber: '31000001',
    assetSubNumber: '00',
    description: 'Scanner - Warehouse B',
    costCenter: 'CC-2000',
    statusId: '01',
  },
];

async function main() {
  for (const code of STATUS_CODES) {
    await prisma.assetStatusCode.upsert({
      where: { statusId: code.statusId },
      update: { statusText: code.statusText },
      create: code,
    });
  }

  for (const asset of ASSETS) {
    const assetTagNumber = `${asset.mainAssetNumber}-${asset.assetSubNumber}`;

    await prisma.assetMaster.upsert({
      where: { assetTagNumber },
      update: {},
      create: {
        assetTagNumber,
        companyCode: asset.companyCode,
        mainAssetNumber: asset.mainAssetNumber,
        assetSubNumber: asset.assetSubNumber,
        description: asset.description,
        costCenter: asset.costCenter,
      },
    });

    await prisma.assetStatusTracker.upsert({
      where: { assetTagNumber },
      update: {},
      create: {
        assetTagNumber,
        companyCode: asset.companyCode,
        mainAssetNumber: asset.mainAssetNumber,
        assetSubNumber: asset.assetSubNumber,
        statusId: asset.statusId,
        lastCountedDate: new Date(),
        updatedByUser: 'seed',
      },
    });
  }

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ASSET_ADMIN',
      companyCode: 'COMP',
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

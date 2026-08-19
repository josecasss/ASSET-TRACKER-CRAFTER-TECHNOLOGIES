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

  const USERS = [
    { username: 'admin', password: 'Admin123!', role: 'ASSET_ADMIN', companyCode: 'COMP' },
    { username: 'worker', password: 'Worker123!', role: 'ASSET_WORKER', companyCode: 'COMP' },
    { username: 'viewer', password: 'Viewer123!', role: 'ASSET_VIEWER', companyCode: 'COMP' },
    { username: 'othr_admin', password: 'Othr123!', role: 'ASSET_ADMIN', companyCode: 'OTHR' },
  ];

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: { passwordHash, role: user.role, companyCode: user.companyCode },
      create: {
        username: user.username,
        passwordHash,
        role: user.role,
        companyCode: user.companyCode,
      },
    });
  }

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

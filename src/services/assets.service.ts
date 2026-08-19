import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';

export interface CreateAssetInput {
  assetTagNumber: string;
  companyCode: string;
  mainAssetNumber: string;
  assetSubNumber: string;
  description: string;
  costCenter: string;
  statusId: string;
}

export async function getAssets() {
  return prisma.assetMaster.findMany({
    include: {
      tracker: {
        include: {
          statusCode: true,
        },
      },
    },
  });
}

export async function getAssetByTag(assetTagNumber: string) {
  const asset = await prisma.assetMaster.findUnique({
    where: { assetTagNumber: assetTagNumber },
    include: {
      tracker: {
        include: {
          statusCode: true,
          history: {
            include: {
              statusCode: true,
            },
            orderBy: {
              changedAt: 'desc',
            },
          },
        },
      },
    },
  });

  if (!asset) {
    throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  return asset;
}

export async function getAssetHistory(assetTagNumber: string) {
  const history = await prisma.assetStatusHistory.findMany({
    where: { assetTagNumber },
    include: {
      statusCode: true,
    },
    orderBy: { changedAt: 'desc' },
  });

  return history;
}

export async function createAsset(input: CreateAssetInput) {
  const statusCode = await prisma.assetStatusCode.findUnique({
    where: { statusId: input.statusId },
  });

  if (!statusCode) {
    throw new ApiError(400, 'INVALID_STATUS', 'Status code does not exist.');
  }

  const assetTagNumber = input.assetTagNumber;

  const asset = await prisma.assetMaster.upsert({
    where: { assetTagNumber },
    update: {
      companyCode: input.companyCode,
      mainAssetNumber: input.mainAssetNumber,
      assetSubNumber: input.assetSubNumber,
      description: input.description,
      costCenter: input.costCenter,
    },
    create: {
      assetTagNumber,
      companyCode: input.companyCode,
      mainAssetNumber: input.mainAssetNumber,
      assetSubNumber: input.assetSubNumber,
      description: input.description,
      costCenter: input.costCenter,
    },
  });

  const tracker = await prisma.assetStatusTracker.upsert({
    where: { assetTagNumber },
    update: {
      companyCode: input.companyCode,
      mainAssetNumber: input.mainAssetNumber,
      assetSubNumber: input.assetSubNumber,
      statusId: input.statusId,
      lastCountedDate: new Date(),
      updatedByUser: 'system',
    },
    create: {
      assetTagNumber,
      companyCode: input.companyCode,
      mainAssetNumber: input.mainAssetNumber,
      assetSubNumber: input.assetSubNumber,
      statusId: input.statusId,
      lastCountedDate: new Date(),
      updatedByUser: 'system',
    },
  });

  await prisma.assetStatusHistory.create({
    data: {
      assetTagNumber,
      statusId: input.statusId,
      changedBy: 'system',
    },
  });

  return { asset, tracker };
}

export async function updateAssetStatus(assetTagNumber: string, statusId: string, changedBy: string) {
  const asset = await prisma.assetMaster.findUnique({ where: { assetTagNumber } });

  if (!asset) {
    throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  const statusCode = await prisma.assetStatusCode.findUnique({
    where: { statusId },
  });

  if (!statusCode) {
    throw new ApiError(400, 'INVALID_STATUS', 'Status code does not exist.');
  }

  const tracker = await prisma.assetStatusTracker.upsert({
    where: { assetTagNumber },
    update: {
      statusId,
      lastCountedDate: new Date(),
      updatedByUser: changedBy,
    },
    create: {
      assetTagNumber,
      companyCode: asset.companyCode,
      mainAssetNumber: asset.mainAssetNumber,
      assetSubNumber: asset.assetSubNumber,
      statusId,
      lastCountedDate: new Date(),
      updatedByUser: changedBy,
    },
  });

  await prisma.assetStatusHistory.create({
    data: {
      assetTagNumber,
      statusId,
      changedBy,
    },
  });

  return tracker;
}

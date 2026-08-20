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
  updatedByUser: string;
}

export async function getAssets(companyCode: string) {
  return prisma.assetMaster.findMany({
    where: { companyCode },
    include: {
      tracker: {
        include: {
          statusCode: true,
        },
      },
    },
  });
}

export async function getAssetByTag(assetTagNumber: string, companyCode: string) {
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

  if (!asset || asset.companyCode !== companyCode) {
    throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  return asset;
}

export async function getAssetHistory(assetTagNumber: string, companyCode: string) {
  const history = await prisma.assetStatusHistory.findMany({
    where: {
      assetTagNumber,
      tracker: { companyCode },
    },
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

  if (!statusCode || !statusCode.active) {
    throw new ApiError(400, 'INVALID_STATUS', 'Status code does not exist.');
  }

  const assetTagNumber = input.assetTagNumber;

  return prisma.$transaction(async (transaction) => {
    const existingAsset = await transaction.assetMaster.findUnique({ where: { assetTagNumber } });
    if (existingAsset && existingAsset.companyCode !== input.companyCode) {
      throw new ApiError(403, 'FORBIDDEN', 'Asset belongs to another company.');
    }

    const asset = await transaction.assetMaster.upsert({
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

    const tracker = await transaction.assetStatusTracker.upsert({
      where: { assetTagNumber },
      update: {
        companyCode: input.companyCode,
        mainAssetNumber: input.mainAssetNumber,
        assetSubNumber: input.assetSubNumber,
        statusId: input.statusId,
        lastCountedDate: new Date(),
        updatedByUser: input.updatedByUser,
      },
      create: {
        assetTagNumber,
        companyCode: input.companyCode,
        mainAssetNumber: input.mainAssetNumber,
        assetSubNumber: input.assetSubNumber,
        statusId: input.statusId,
        lastCountedDate: new Date(),
        updatedByUser: input.updatedByUser,
      },
    });

    await transaction.assetStatusHistory.create({
      data: {
        assetTagNumber,
        statusId: input.statusId,
        changedBy: input.updatedByUser,
      },
    });

    return { asset, tracker };
  });
}

export async function updateAssetStatus(assetTagNumber: string, statusId: string, changedBy: string, companyCode: string) {
  const asset = await prisma.assetMaster.findFirst({ where: { assetTagNumber, companyCode } });

  if (!asset) {
    throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset not found.');
  }

  const statusCode = await prisma.assetStatusCode.findUnique({
    where: { statusId },
  });

  if (!statusCode || !statusCode.active) {
    throw new ApiError(400, 'INVALID_STATUS', 'Status code does not exist.');
  }

  return prisma.$transaction(async (transaction) => {
    const tracker = await transaction.assetStatusTracker.upsert({
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

    await transaction.assetStatusHistory.create({
      data: {
        assetTagNumber,
        statusId,
        changedBy,
      },
    });

    return tracker;
  });
}

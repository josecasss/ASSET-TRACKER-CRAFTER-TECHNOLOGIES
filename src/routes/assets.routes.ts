import { Router } from 'express';
import { ApiError } from '../lib/api-error';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  createAsset,
  getAssetByTag,
  getAssetHistory,
  getAssets,
  updateAssetStatus,
} from '../services/assets.service';

export const assetRouter = Router();

assetRouter.use(requireAuth);

assetRouter.get('/', async (_req, res, next) => {
  try {
    const assets = await getAssets(_req.auth!.companyCode);
    res.status(200).json(assets);
  } catch (err) {
    next(err);
  }
});

assetRouter.get('/:assetTagNumber/history', async (req, res, next) => {
  try {
    const history = await getAssetHistory(req.params.assetTagNumber, req.auth!.companyCode);
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
});

assetRouter.get('/:assetTagNumber', async (req, res, next) => {
  try {
    const asset = await getAssetByTag(req.params.assetTagNumber, req.auth!.companyCode);
    res.status(200).json(asset);
  } catch (err) {
    next(err);
  }
});

assetRouter.post('/', requireRole('ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { assetTagNumber, companyCode, mainAssetNumber, assetSubNumber, description, costCenter, statusId } = req.body ?? {};

    if (
      typeof assetTagNumber !== 'string' ||
      typeof companyCode !== 'string' ||
      typeof mainAssetNumber !== 'string' ||
      typeof assetSubNumber !== 'string' ||
      typeof description !== 'string' ||
      typeof costCenter !== 'string' ||
      typeof statusId !== 'string'
    ) {
      throw new ApiError(400, 'INVALID_REQUEST', 'All required asset fields are required.');
    }

    if (companyCode !== req.auth!.companyCode) {
      throw new ApiError(403, 'FORBIDDEN', 'Asset company does not match the authenticated user.');
    }

    const asset = await createAsset({
      assetTagNumber,
      companyCode,
      mainAssetNumber,
      assetSubNumber,
      description,
      costCenter,
      statusId,
      updatedByUser: req.auth!.username,
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

assetRouter.patch('/:assetTagNumber/status', requireRole('ASSET_WORKER'), async (req, res, next) => {
  try {
    const { statusId } = req.body ?? {};
    const assetTagNumber = req.params.assetTagNumber;

    if (typeof statusId !== 'string' || typeof assetTagNumber !== 'string') {
      throw new ApiError(400, 'INVALID_REQUEST', 'statusId and assetTagNumber are required.');
    }

    const tracker = await updateAssetStatus(assetTagNumber, statusId, req.auth!.username, req.auth!.companyCode);
    res.status(200).json(tracker);
  } catch (err) {
    next(err);
  }
});

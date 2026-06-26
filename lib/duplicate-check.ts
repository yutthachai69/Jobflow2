export interface DuplicateCheckItem {
  id: string;
  siteId?: string | null;
  jobType: string;
  status: string;
  scheduledDate: Date;
  jobItems: Array<{ 
    asset: { id: string; qrCode: string }; 
    adHocPmType?: string | null 
  }>;
}

export interface DuplicateCheckResult {
  isPotentialDuplicatePmMonthly: boolean;
  potentialDuplicateAssetCodes: string[];
  potentialDuplicatePmCount: number;
  conflictingWorkOrderIds: string[];
}

export function markPotentialPmMonthlyDuplicates<T extends DuplicateCheckItem>(
  items: T[]
): Array<T & DuplicateCheckResult> {
  // key: siteId_month_assetId_pmType -> list of workOrderIds
  const assetPmToWorkOrders = new Map<string, string[]>();

  for (const item of items) {
    if (item.jobType !== 'PM' || item.status === 'CANCELLED') continue;
    const date = new Date(item.scheduledDate);
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    
    const uniqueAssetPmKeys = new Set(
      item.jobItems
        .filter((job) => job.adHocPmType === 'MAJOR' || job.adHocPmType === 'MINOR')
        .map((job) => `${job.asset.id}_${job.adHocPmType}`)
    );

    for (const assetPm of uniqueAssetPmKeys) {
      const key = `${item.siteId ?? ''}_${month}_${assetPm}`;
      const existing = assetPmToWorkOrders.get(key) ?? [];
      assetPmToWorkOrders.set(key, [...existing, item.id]);
    }
  }

  return items.map((item) => {
    if (item.jobType !== 'PM' || item.status === 'CANCELLED') {
      return {
        ...item,
        isPotentialDuplicatePmMonthly: false,
        potentialDuplicateAssetCodes: [],
        potentialDuplicatePmCount: 0,
        conflictingWorkOrderIds: [],
      };
    }

    const date = new Date(item.scheduledDate);
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const uniqueAssets = new Map<string, { qrCode: string; pmType: string }>();
    
    for (const job of item.jobItems) {
      if (job.adHocPmType !== 'MAJOR' && job.adHocPmType !== 'MINOR') continue;
      uniqueAssets.set(`${job.asset.id}_${job.adHocPmType}`, {
        qrCode: job.asset.qrCode,
        pmType: job.adHocPmType === 'MAJOR' ? 'ล้างใหญ่' : 'ล้างย่อย',
      });
    }

    const duplicateAssetCodes: string[] = [];
    const conflictingIdsSet = new Set<string>();

    for (const [assetPm, info] of uniqueAssets.entries()) {
      const key = `${item.siteId ?? ''}_${month}_${assetPm}`;
      const matches = assetPmToWorkOrders.get(key) ?? [];
      if (matches.length > 1) {
        duplicateAssetCodes.push(`${info.qrCode} (${info.pmType})`);
        matches.forEach(id => {
          if (id !== item.id) conflictingIdsSet.add(id);
        });
      }
    }

    return {
      ...item,
      isPotentialDuplicatePmMonthly: duplicateAssetCodes.length > 0,
      potentialDuplicateAssetCodes: duplicateAssetCodes,
      potentialDuplicatePmCount: conflictingIdsSet.size + 1,
      conflictingWorkOrderIds: Array.from(conflictingIdsSet),
    };
  });
}

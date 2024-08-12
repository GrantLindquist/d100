import { UnitEnum } from '@/types/Unit';

export const getCampaignIdFromUrl = (url: string[]) => {
  const baseIndex = url.lastIndexOf('campaigns');
  if (baseIndex !== -1 && url.length > baseIndex) {
    return url[baseIndex + 1];
  } else {
    return null;
  }
};

export const getCurrentUnitIdFromUrl = (url: string[]) => {
  let baseIndex = -1;
  UnitEnum.forEach((term) => {
    const index = url.lastIndexOf(`${term}s`);
    if (index > baseIndex) {
      baseIndex = index;
    }
  });

  if (baseIndex !== -1 && url.length > baseIndex) {
    return url[baseIndex + 1];
  } else {
    return null;
  }
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.client.upsert({
    where: { id: 'CLIENT_DEFAULT' },
    update: {},
    create: { id: 'CLIENT_DEFAULT', name: 'ลูกค้าทั่วไป' }
  });

  await prisma.site.upsert({
    where: { id: 'SITE_PHYATHAI' },
    update: {},
    create: { id: 'SITE_PHYATHAI', name: 'รพ.พญาไท', clientId: 'CLIENT_DEFAULT' }
  });

  await prisma.building.upsert({
    where: { id: 'BLD_PHY_A' },
    update: {},
    create: { id: 'BLD_PHY_A', name: 'A', siteId: 'SITE_PHYATHAI' }
  });

  await prisma.floor.upsert({
    where: { id: 'FLR_PHY_A_2' },
    update: {},
    create: { id: 'FLR_PHY_A_2', name: 'ชั้น 2', buildingId: 'BLD_PHY_A' }
  });

  await prisma.floor.upsert({
    where: { id: 'FLR_PHY_A_3' },
    update: {},
    create: { id: 'FLR_PHY_A_3', name: 'ชั้น 3', buildingId: 'BLD_PHY_A' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_1' },
    update: {},
    create: { id: 'RM_PHY_A_2_1', name: 'แผนกNCU 1.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '1' },
    update: {},
    create: { id: 'ASSET_1', qrCode: '1', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_1' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_2' },
    update: {},
    create: { id: 'RM_PHY_A_2_2', name: 'แผนกNCU 2.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '2' },
    update: {},
    create: { id: 'ASSET_2', qrCode: '2', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_2' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_3' },
    update: {},
    create: { id: 'RM_PHY_A_2_3', name: 'ส่วนเภสัชกรรม 1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '3' },
    update: {},
    create: { id: 'ASSET_3', qrCode: '3', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_3' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_4' },
    update: {},
    create: { id: 'RM_PHY_A_2_4', name: 'ส่วนเภสัชกรรม 2 (ห้องผจก.)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '4' },
    update: {},
    create: { id: 'ASSET_4', qrCode: '4', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_4' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_5' },
    update: {},
    create: { id: 'RM_PHY_A_2_5', name: 'LAB ห้องเปลี่ยนรองเท้าและเสื้อกาวด์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '5' },
    update: {},
    create: { id: 'ASSET_5', qrCode: '5', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_5' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_6' },
    update: {},
    create: { id: 'RM_PHY_A_2_6', name: 'LAB ห้องผจก.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '6' },
    update: {},
    create: { id: 'ASSET_6', qrCode: '6', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_6' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_7' },
    update: {},
    create: { id: 'RM_PHY_A_2_7', name: 'LAB ห้องตู้เบรคเกอร์ไฟฟ้า', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '7' },
    update: {},
    create: { id: 'ASSET_7', qrCode: '7', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_7' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_8' },
    update: {},
    create: { id: 'RM_PHY_A_2_8', name: 'LAB Document room', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '8' },
    update: {},
    create: { id: 'ASSET_8', qrCode: '8', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_8' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_9' },
    update: {},
    create: { id: 'RM_PHY_A_2_9', name: 'LAB ห้องStaff Lounge', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '9' },
    update: {},
    create: { id: 'ASSET_9', qrCode: '9', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_9' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_10' },
    update: {},
    create: { id: 'RM_PHY_A_2_10', name: 'LAB BLOOD BANK', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '10' },
    update: {},
    create: { id: 'ASSET_10', qrCode: '10', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_10' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_11' },
    update: {},
    create: { id: 'RM_PHY_A_2_11', name: 'LAB โถงทางเดิน1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '11' },
    update: {},
    create: { id: 'ASSET_11', qrCode: '11', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_11' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_12' },
    update: {},
    create: { id: 'RM_PHY_A_2_12', name: 'LAB โถงทางเดิน2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '12' },
    update: {},
    create: { id: 'ASSET_12', qrCode: '12', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_12' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_13' },
    update: {},
    create: { id: 'RM_PHY_A_2_13', name: 'LAB โถงทางเดิน3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '13' },
    update: {},
    create: { id: 'ASSET_13', qrCode: '13', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_13' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_14' },
    update: {},
    create: { id: 'RM_PHY_A_2_14', name: 'LAB โถงทางเดิน4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '14' },
    update: {},
    create: { id: 'ASSET_14', qrCode: '14', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_14' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_15' },
    update: {},
    create: { id: 'RM_PHY_A_2_15', name: 'LAB หน้าห้องกำจัดของเสีย', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '15' },
    update: {},
    create: { id: 'ASSET_15', qrCode: '15', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_15' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_16' },
    update: {},
    create: { id: 'RM_PHY_A_2_16', name: 'LAB ห้องกำจัดของเสีย', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '16' },
    update: {},
    create: { id: 'ASSET_16', qrCode: '16', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_16' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_17' },
    update: {},
    create: { id: 'RM_PHY_A_2_17', name: 'LAB ห้องเเบคทีเรีย', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '17' },
    update: {},
    create: { id: 'ASSET_17', qrCode: '17', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_17' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_18' },
    update: {},
    create: { id: 'RM_PHY_A_2_18', name: 'LAB ห้องSTOCKตัวที่ 1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '18' },
    update: {},
    create: { id: 'ASSET_18', qrCode: '18', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_18' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_19' },
    update: {},
    create: { id: 'RM_PHY_A_2_19', name: 'LAB ห้องSTOCKตัวที่ 2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '19' },
    update: {},
    create: { id: 'ASSET_19', qrCode: '19', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_19' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_20' },
    update: {},
    create: { id: 'RM_PHY_A_2_20', name: 'LABโถงกลาง', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '20' },
    update: {},
    create: { id: 'ASSET_20', qrCode: '20', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_20' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_21' },
    update: {},
    create: { id: 'RM_PHY_A_2_21', name: 'LABหน้าห้อง STOCK', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '21' },
    update: {},
    create: { id: 'ASSET_21', qrCode: '21', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_21' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_22' },
    update: {},
    create: { id: 'RM_PHY_A_2_22', name: 'LAB หน้าLABโลหะหน้าห้องน้ำ', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '22' },
    update: {},
    create: { id: 'ASSET_22', qrCode: '22', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_22' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_23' },
    update: {},
    create: { id: 'RM_PHY_A_2_23', name: 'LAB หน้าLABโลหะข้างห้อง STOCK', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '23' },
    update: {},
    create: { id: 'ASSET_23', qrCode: '23', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_23' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_24' },
    update: {},
    create: { id: 'RM_PHY_A_2_24', name: 'LABโลหะหนัก1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '24' },
    update: {},
    create: { id: 'ASSET_24', qrCode: '24', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_24' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_25' },
    update: {},
    create: { id: 'RM_PHY_A_2_25', name: 'LABโลหะหนัก2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '25' },
    update: {},
    create: { id: 'ASSET_25', qrCode: '25', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_25' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_26' },
    update: {},
    create: { id: 'RM_PHY_A_2_26', name: 'LABโลหะหนัก3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '26' },
    update: {},
    create: { id: 'ASSET_26', qrCode: '26', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_26' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_27' },
    update: {},
    create: { id: 'RM_PHY_A_2_27', name: 'LABโลหะหนัก4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '27' },
    update: {},
    create: { id: 'ASSET_27', qrCode: '27', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_27' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_28' },
    update: {},
    create: { id: 'RM_PHY_A_2_28', name: 'CCU เคาน์เตอร์ 1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '28' },
    update: {},
    create: { id: 'ASSET_28', qrCode: '28', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_28' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_29' },
    update: {},
    create: { id: 'RM_PHY_A_2_29', name: 'CCU เคาน์เตอร์ 2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '29' },
    update: {},
    create: { id: 'ASSET_29', qrCode: '29', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_29' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_30' },
    update: {},
    create: { id: 'RM_PHY_A_2_30', name: 'CCU 1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '30' },
    update: {},
    create: { id: 'ASSET_30', qrCode: '30', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_30' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_31' },
    update: {},
    create: { id: 'RM_PHY_A_2_31', name: 'CCU 2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '31' },
    update: {},
    create: { id: 'ASSET_31', qrCode: '31', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_31' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_32' },
    update: {},
    create: { id: 'RM_PHY_A_2_32', name: 'CCU 3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '32' },
    update: {},
    create: { id: 'ASSET_32', qrCode: '32', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_32' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_33' },
    update: {},
    create: { id: 'RM_PHY_A_2_33', name: 'CCU 4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '33' },
    update: {},
    create: { id: 'ASSET_33', qrCode: '33', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_33' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_34' },
    update: {},
    create: { id: 'RM_PHY_A_2_34', name: 'CCU 5', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '34' },
    update: {},
    create: { id: 'ASSET_34', qrCode: '34', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_34' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_35' },
    update: {},
    create: { id: 'RM_PHY_A_2_35', name: 'CCU 6', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '35' },
    update: {},
    create: { id: 'ASSET_35', qrCode: '35', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_35' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_36' },
    update: {},
    create: { id: 'RM_PHY_A_2_36', name: 'CCU 7', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '36' },
    update: {},
    create: { id: 'ASSET_36', qrCode: '36', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_36' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_37' },
    update: {},
    create: { id: 'RM_PHY_A_2_37', name: 'CCU 8', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '37' },
    update: {},
    create: { id: 'ASSET_37', qrCode: '37', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_37' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_38' },
    update: {},
    create: { id: 'RM_PHY_A_2_38', name: 'CCU 9', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '38' },
    update: {},
    create: { id: 'ASSET_38', qrCode: '38', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_38' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_39' },
    update: {},
    create: { id: 'RM_PHY_A_2_39', name: 'CCU ห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '39' },
    update: {},
    create: { id: 'ASSET_39', qrCode: '39', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_39' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_40' },
    update: {},
    create: { id: 'RM_PHY_A_2_40', name: 'CCU ห้องกินข้าว.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '40' },
    update: {},
    create: { id: 'ASSET_40', qrCode: '40', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_40' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_41' },
    update: {},
    create: { id: 'RM_PHY_A_2_41', name: 'CCU ห้องซัพพลาย.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '41' },
    update: {},
    create: { id: 'ASSET_41', qrCode: '41', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_41' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_42' },
    update: {},
    create: { id: 'RM_PHY_A_2_42', name: 'ห้องคลอด(ห้องAHU).', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '42' },
    update: {},
    create: { id: 'ASSET_42', qrCode: '42', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_42' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_43' },
    update: {},
    create: { id: 'RM_PHY_A_2_43', name: 'ห้องคลอด(ห้องNICU).', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '43' },
    update: {},
    create: { id: 'ASSET_43', qrCode: '43', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_43' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_44' },
    update: {},
    create: { id: 'RM_PHY_A_2_44', name: 'ห้องคลอด(ห้องWELL BABY).', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '44' },
    update: {},
    create: { id: 'ASSET_44', qrCode: '44', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_44' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_45' },
    update: {},
    create: { id: 'RM_PHY_A_2_45', name: 'ห้องคลอด(ห้องพักแพทย์)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '45' },
    update: {},
    create: { id: 'ASSET_45', qrCode: '45', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_45' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_46' },
    update: {},
    create: { id: 'RM_PHY_A_2_46', name: 'ห้องคลอด(ห้องซัพพลาย)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '46' },
    update: {},
    create: { id: 'ASSET_46', qrCode: '46', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_46' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_47' },
    update: {},
    create: { id: 'RM_PHY_A_2_47', name: 'ห้องคลอด ทางเดินด้านหลังตรงซิ๊งล้าง.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '47' },
    update: {},
    create: { id: 'ASSET_47', qrCode: '47', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_47' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_48' },
    update: {},
    create: { id: 'RM_PHY_A_2_48', name: 'ประตูทางเข้าห้องคลอด(ด้านในประตู)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '48' },
    update: {},
    create: { id: 'ASSET_48', qrCode: '48', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_48' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_49' },
    update: {},
    create: { id: 'RM_PHY_A_2_49', name: 'ทางเดินหน้าห้องคลอด.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '49' },
    update: {},
    create: { id: 'ASSET_49', qrCode: '49', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_49' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_50' },
    update: {},
    create: { id: 'RM_PHY_A_2_50', name: 'ทางเดินหน้าCATH LAB.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '50' },
    update: {},
    create: { id: 'ASSET_50', qrCode: '50', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_50' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_51' },
    update: {},
    create: { id: 'RM_PHY_A_2_51', name: 'OR ห้องสเตอร์ไลน์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '51' },
    update: {},
    create: { id: 'ASSET_51', qrCode: '51', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_51' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_52' },
    update: {},
    create: { id: 'RM_PHY_A_2_52', name: 'OR ห้องกินข้าว.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '52' },
    update: {},
    create: { id: 'ASSET_52', qrCode: '52', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_52' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_53' },
    update: {},
    create: { id: 'RM_PHY_A_2_53', name: 'OR ห้องดูทีวี.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '53' },
    update: {},
    create: { id: 'ASSET_53', qrCode: '53', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_53' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_54' },
    update: {},
    create: { id: 'RM_PHY_A_2_54', name: 'OR ห้องนอนเวร 1.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '54' },
    update: {},
    create: { id: 'ASSET_54', qrCode: '54', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_54' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_55' },
    update: {},
    create: { id: 'RM_PHY_A_2_55', name: 'OR ห้องนอนเวร 2.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '55' },
    update: {},
    create: { id: 'ASSET_55', qrCode: '55', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_55' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_56' },
    update: {},
    create: { id: 'RM_PHY_A_2_56', name: 'OR ห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '56' },
    update: {},
    create: { id: 'ASSET_56', qrCode: '56', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_56' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_57' },
    update: {},
    create: { id: 'RM_PHY_A_2_57', name: 'CATH LAB ห้องX-RAY 1.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '57' },
    update: {},
    create: { id: 'ASSET_57', qrCode: '57', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_57' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_58' },
    update: {},
    create: { id: 'RM_PHY_A_2_58', name: 'CATH LAB ห้องX-RAY 2.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '58' },
    update: {},
    create: { id: 'ASSET_58', qrCode: '58', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_58' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_59' },
    update: {},
    create: { id: 'RM_PHY_A_2_59', name: 'CATH LAB ห้องผจก.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '59' },
    update: {},
    create: { id: 'ASSET_59', qrCode: '59', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_59' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_60' },
    update: {},
    create: { id: 'RM_PHY_A_2_60', name: 'CATH LAB โถงหน้าห้องX-RAY.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '60' },
    update: {},
    create: { id: 'ASSET_60', qrCode: '60', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_60' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_61' },
    update: {},
    create: { id: 'RM_PHY_A_2_61', name: 'CATH LAB ห้องคอนโทรลX-RAY.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '61' },
    update: {},
    create: { id: 'ASSET_61', qrCode: '61', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_61' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_62' },
    update: {},
    create: { id: 'RM_PHY_A_2_62', name: 'CATH LAB ห้องกินข้าว.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '62' },
    update: {},
    create: { id: 'ASSET_62', qrCode: '62', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_62' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_63' },
    update: {},
    create: { id: 'RM_PHY_A_2_63', name: 'CATH LAB ทางเดินหน้าห้องกินข้าว.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '63' },
    update: {},
    create: { id: 'ASSET_63', qrCode: '63', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_63' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_64' },
    update: {},
    create: { id: 'RM_PHY_A_2_64', name: 'ICUโซนหน้า(หน้าห้องพักญาติ).', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '64' },
    update: {},
    create: { id: 'ASSET_64', qrCode: '64', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_64' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_65' },
    update: {},
    create: { id: 'RM_PHY_A_2_65', name: 'ICUโซนหลัง(ห้องติดห้องกินข้าวCATH LAB)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '65' },
    update: {},
    create: { id: 'ASSET_65', qrCode: '65', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_65' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_66' },
    update: {},
    create: { id: 'RM_PHY_A_2_66', name: 'ICU 4.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '66' },
    update: {},
    create: { id: 'ASSET_66', qrCode: '66', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_66' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_67' },
    update: {},
    create: { id: 'RM_PHY_A_2_67', name: 'ICU 9.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '67' },
    update: {},
    create: { id: 'ASSET_67', qrCode: '67', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_67' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_68' },
    update: {},
    create: { id: 'RM_PHY_A_2_68', name: 'ICU 10.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '68' },
    update: {},
    create: { id: 'ASSET_68', qrCode: '68', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_68' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_69' },
    update: {},
    create: { id: 'RM_PHY_A_2_69', name: 'ICU 11.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '69' },
    update: {},
    create: { id: 'ASSET_69', qrCode: '69', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_69' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_70' },
    update: {},
    create: { id: 'RM_PHY_A_2_70', name: 'ICU 12.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '70' },
    update: {},
    create: { id: 'ASSET_70', qrCode: '70', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_70' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_71' },
    update: {},
    create: { id: 'RM_PHY_A_2_71', name: 'ICU 13.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '71' },
    update: {},
    create: { id: 'ASSET_71', qrCode: '71', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_71' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_72' },
    update: {},
    create: { id: 'RM_PHY_A_2_72', name: 'ICU ห้องซัพพลาย.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '72' },
    update: {},
    create: { id: 'ASSET_72', qrCode: '72', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_72' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_73' },
    update: {},
    create: { id: 'RM_PHY_A_2_73', name: 'CCSD ห้องAHU.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '73' },
    update: {},
    create: { id: 'ASSET_73', qrCode: '73', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_73' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_74' },
    update: {},
    create: { id: 'RM_PHY_A_2_74', name: 'CCSD ห้องสเตอไลน์..', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '74' },
    update: {},
    create: { id: 'ASSET_74', qrCode: '74', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_74' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_75' },
    update: {},
    create: { id: 'RM_PHY_A_2_75', name: 'ทางเดินชั้น2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '75' },
    update: {},
    create: { id: 'ASSET_75', qrCode: '75', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_75' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_76' },
    update: {},
    create: { id: 'RM_PHY_A_2_76', name: 'ICU', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '76' },
    update: {},
    create: { id: 'ASSET_76', qrCode: '76', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_76' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_77' },
    update: {},
    create: { id: 'RM_PHY_A_2_77', name: 'ICUหน้าห้องล้าง', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '77' },
    update: {},
    create: { id: 'ASSET_77', qrCode: '77', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_77' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_78' },
    update: {},
    create: { id: 'RM_PHY_A_2_78', name: 'ICU4 ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '78' },
    update: {},
    create: { id: 'ASSET_78', qrCode: '78', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_78' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_79' },
    update: {},
    create: { id: 'RM_PHY_A_2_79', name: 'ICU4 ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '79' },
    update: {},
    create: { id: 'ASSET_79', qrCode: '79', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_79' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_80' },
    update: {},
    create: { id: 'RM_PHY_A_2_80', name: 'ICU4 ตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '80' },
    update: {},
    create: { id: 'ASSET_80', qrCode: '80', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_80' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_81' },
    update: {},
    create: { id: 'RM_PHY_A_2_81', name: 'ICU4 ตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '81' },
    update: {},
    create: { id: 'ASSET_81', qrCode: '81', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_81' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_82' },
    update: {},
    create: { id: 'RM_PHY_A_2_82', name: 'ICU5 ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '82' },
    update: {},
    create: { id: 'ASSET_82', qrCode: '82', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_82' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_83' },
    update: {},
    create: { id: 'RM_PHY_A_2_83', name: 'ICU5 ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '83' },
    update: {},
    create: { id: 'ASSET_83', qrCode: '83', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_83' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_84' },
    update: {},
    create: { id: 'RM_PHY_A_2_84', name: 'ICU5 ตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '84' },
    update: {},
    create: { id: 'ASSET_84', qrCode: '84', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_84' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_85' },
    update: {},
    create: { id: 'RM_PHY_A_2_85', name: 'ICU5 ตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '85' },
    update: {},
    create: { id: 'ASSET_85', qrCode: '85', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_85' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_86' },
    update: {},
    create: { id: 'RM_PHY_A_2_86', name: 'ICU6 ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '86' },
    update: {},
    create: { id: 'ASSET_86', qrCode: '86', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_86' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_87' },
    update: {},
    create: { id: 'RM_PHY_A_2_87', name: 'ICU6 ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '87' },
    update: {},
    create: { id: 'ASSET_87', qrCode: '87', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_87' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_88' },
    update: {},
    create: { id: 'RM_PHY_A_2_88', name: 'ICU6 ตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '88' },
    update: {},
    create: { id: 'ASSET_88', qrCode: '88', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_88' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_89' },
    update: {},
    create: { id: 'RM_PHY_A_2_89', name: 'ICU6 ตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '89' },
    update: {},
    create: { id: 'ASSET_89', qrCode: '89', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_89' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_90' },
    update: {},
    create: { id: 'RM_PHY_A_2_90', name: 'ICU7 ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '90' },
    update: {},
    create: { id: 'ASSET_90', qrCode: '90', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_90' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_91' },
    update: {},
    create: { id: 'RM_PHY_A_2_91', name: 'ICU7 ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '91' },
    update: {},
    create: { id: 'ASSET_91', qrCode: '91', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_91' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_92' },
    update: {},
    create: { id: 'RM_PHY_A_2_92', name: 'ICU7 ตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '92' },
    update: {},
    create: { id: 'ASSET_92', qrCode: '92', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_92' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_93' },
    update: {},
    create: { id: 'RM_PHY_A_2_93', name: 'ICU7 ตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '93' },
    update: {},
    create: { id: 'ASSET_93', qrCode: '93', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_93' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_94' },
    update: {},
    create: { id: 'RM_PHY_A_2_94', name: 'ICU8 ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '94' },
    update: {},
    create: { id: 'ASSET_94', qrCode: '94', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_94' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_95' },
    update: {},
    create: { id: 'RM_PHY_A_2_95', name: 'ICU8 ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '95' },
    update: {},
    create: { id: 'ASSET_95', qrCode: '95', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_95' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_96' },
    update: {},
    create: { id: 'RM_PHY_A_2_96', name: 'ICU8 ตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '96' },
    update: {},
    create: { id: 'ASSET_96', qrCode: '96', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_96' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_97' },
    update: {},
    create: { id: 'RM_PHY_A_2_97', name: 'ICU8 ตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '97' },
    update: {},
    create: { id: 'ASSET_97', qrCode: '97', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_97' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_98' },
    update: {},
    create: { id: 'RM_PHY_A_2_98', name: 'ICU10', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '98' },
    update: {},
    create: { id: 'ASSET_98', qrCode: '98', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_98' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_99' },
    update: {},
    create: { id: 'RM_PHY_A_2_99', name: 'ICU11', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '99' },
    update: {},
    create: { id: 'ASSET_99', qrCode: '99', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_99' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_100' },
    update: {},
    create: { id: 'RM_PHY_A_2_100', name: 'ICUห้องผจก.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '100' },
    update: {},
    create: { id: 'ASSET_100', qrCode: '100', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_100' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_101' },
    update: {},
    create: { id: 'RM_PHY_A_2_101', name: 'ICUห้องน้ำตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '101' },
    update: {},
    create: { id: 'ASSET_101', qrCode: '101', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_101' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_102' },
    update: {},
    create: { id: 'RM_PHY_A_2_102', name: 'ICU3 (ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '102' },
    update: {},
    create: { id: 'ASSET_102', qrCode: '102', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_102' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_103' },
    update: {},
    create: { id: 'RM_PHY_A_2_103', name: 'Cath lab', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '103' },
    update: {},
    create: { id: 'ASSET_103', qrCode: '103', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_103' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_104' },
    update: {},
    create: { id: 'RM_PHY_A_2_104', name: 'Cath lab ห้องX-RAY', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '104' },
    update: {},
    create: { id: 'ASSET_104', qrCode: '104', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_104' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_105' },
    update: {},
    create: { id: 'RM_PHY_A_2_105', name: 'Cath lab ห้องน้ำหลังเคาน์เตอร์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '105' },
    update: {},
    create: { id: 'ASSET_105', qrCode: '105', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_105' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_106' },
    update: {},
    create: { id: 'RM_PHY_A_2_106', name: 'Cath lab ห้องน้ำด้านหลังตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '106' },
    update: {},
    create: { id: 'ASSET_106', qrCode: '106', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_106' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_107' },
    update: {},
    create: { id: 'RM_PHY_A_2_107', name: 'Cath lab ห้องน้ำด้านหลังตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '107' },
    update: {},
    create: { id: 'ASSET_107', qrCode: '107', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_107' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_108' },
    update: {},
    create: { id: 'RM_PHY_A_2_108', name: 'Cath lab ห้องกินข้าวตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '108' },
    update: {},
    create: { id: 'ASSET_108', qrCode: '108', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_108' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_109' },
    update: {},
    create: { id: 'RM_PHY_A_2_109', name: 'Cath lab ห้องกินข้าวตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '109' },
    update: {},
    create: { id: 'ASSET_109', qrCode: '109', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_109' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_110' },
    update: {},
    create: { id: 'RM_PHY_A_2_110', name: 'Cath lab หน้าห้องกินข้าว', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '110' },
    update: {},
    create: { id: 'ASSET_110', qrCode: '110', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_110' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_111' },
    update: {},
    create: { id: 'RM_PHY_A_2_111', name: 'Cath lab ห้องล้าง', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '111' },
    update: {},
    create: { id: 'ASSET_111', qrCode: '111', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_111' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_112' },
    update: {},
    create: { id: 'RM_PHY_A_2_112', name: 'NCU', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '112' },
    update: {},
    create: { id: 'ASSET_112', qrCode: '112', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_112' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_113' },
    update: {},
    create: { id: 'RM_PHY_A_2_113', name: 'ห้องผจก.ส่วนเภสัช', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '113' },
    update: {},
    create: { id: 'ASSET_113', qrCode: '113', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_113' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_114' },
    update: {},
    create: { id: 'RM_PHY_A_2_114', name: 'LAB', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '114' },
    update: {},
    create: { id: 'ASSET_114', qrCode: '114', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_114' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_115' },
    update: {},
    create: { id: 'RM_PHY_A_2_115', name: 'LAB', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '115' },
    update: {},
    create: { id: 'ASSET_115', qrCode: '115', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_115' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_116' },
    update: {},
    create: { id: 'RM_PHY_A_2_116', name: 'LABห้องเปลี่ยนเสื้อกาวน์ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '116' },
    update: {},
    create: { id: 'ASSET_116', qrCode: '116', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_116' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_117' },
    update: {},
    create: { id: 'RM_PHY_A_2_117', name: 'LABห้องเปลี่ยนเสื้อกาวน์ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '117' },
    update: {},
    create: { id: 'ASSET_117', qrCode: '117', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_117' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_118' },
    update: {},
    create: { id: 'RM_PHY_A_2_118', name: 'LABห้องเครื่องกระสวยตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '118' },
    update: {},
    create: { id: 'ASSET_118', qrCode: '118', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_118' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_119' },
    update: {},
    create: { id: 'RM_PHY_A_2_119', name: 'LABห้องกำจัดของเสีย', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '119' },
    update: {},
    create: { id: 'ASSET_119', qrCode: '119', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_119' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_120' },
    update: {},
    create: { id: 'RM_PHY_A_2_120', name: 'LABอ่างล้างหน้าห้องBacteria', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '120' },
    update: {},
    create: { id: 'ASSET_120', qrCode: '120', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_120' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_121' },
    update: {},
    create: { id: 'RM_PHY_A_2_121', name: 'LABอ่างล้างหน้าห้องBacteria', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '121' },
    update: {},
    create: { id: 'ASSET_121', qrCode: '121', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_121' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_122' },
    update: {},
    create: { id: 'RM_PHY_A_2_122', name: 'LABโลหะหนักตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '122' },
    update: {},
    create: { id: 'ASSET_122', qrCode: '122', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_122' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_123' },
    update: {},
    create: { id: 'RM_PHY_A_2_123', name: 'LABโลหะหนักตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '123' },
    update: {},
    create: { id: 'ASSET_123', qrCode: '123', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_123' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_124' },
    update: {},
    create: { id: 'RM_PHY_A_2_124', name: 'LABโลหะหนักตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '124' },
    update: {},
    create: { id: 'ASSET_124', qrCode: '124', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_124' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_125' },
    update: {},
    create: { id: 'RM_PHY_A_2_125', name: 'LABโลหะหนักตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '125' },
    update: {},
    create: { id: 'ASSET_125', qrCode: '125', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_125' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_126' },
    update: {},
    create: { id: 'RM_PHY_A_2_126', name: 'CCU', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '126' },
    update: {},
    create: { id: 'ASSET_126', qrCode: '126', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_126' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_127' },
    update: {},
    create: { id: 'RM_PHY_A_2_127', name: 'CCU1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '127' },
    update: {},
    create: { id: 'ASSET_127', qrCode: '127', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_127' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_128' },
    update: {},
    create: { id: 'RM_PHY_A_2_128', name: 'CCU2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '128' },
    update: {},
    create: { id: 'ASSET_128', qrCode: '128', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_128' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_129' },
    update: {},
    create: { id: 'RM_PHY_A_2_129', name: 'CCU3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '129' },
    update: {},
    create: { id: 'ASSET_129', qrCode: '129', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_129' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_130' },
    update: {},
    create: { id: 'RM_PHY_A_2_130', name: 'CCU4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '130' },
    update: {},
    create: { id: 'ASSET_130', qrCode: '130', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_130' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_131' },
    update: {},
    create: { id: 'RM_PHY_A_2_131', name: 'CCU5', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '131' },
    update: {},
    create: { id: 'ASSET_131', qrCode: '131', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_131' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_132' },
    update: {},
    create: { id: 'RM_PHY_A_2_132', name: 'CCU6', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '132' },
    update: {},
    create: { id: 'ASSET_132', qrCode: '132', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_132' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_133' },
    update: {},
    create: { id: 'RM_PHY_A_2_133', name: 'CCU7', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '133' },
    update: {},
    create: { id: 'ASSET_133', qrCode: '133', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_133' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_134' },
    update: {},
    create: { id: 'RM_PHY_A_2_134', name: 'CCU8', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '134' },
    update: {},
    create: { id: 'ASSET_134', qrCode: '134', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_134' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_135' },
    update: {},
    create: { id: 'RM_PHY_A_2_135', name: 'CCU9', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '135' },
    update: {},
    create: { id: 'ASSET_135', qrCode: '135', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_135' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_136' },
    update: {},
    create: { id: 'RM_PHY_A_2_136', name: 'CCUห้องน้ำ', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '136' },
    update: {},
    create: { id: 'ASSET_136', qrCode: '136', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_136' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_137' },
    update: {},
    create: { id: 'RM_PHY_A_2_137', name: 'CCUหน้าห้องน้ำ', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '137' },
    update: {},
    create: { id: 'ASSET_137', qrCode: '137', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_137' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_138' },
    update: {},
    create: { id: 'RM_PHY_A_2_138', name: 'CCUห้องล้างเครื่องมือ', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '138' },
    update: {},
    create: { id: 'ASSET_138', qrCode: '138', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_138' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_139' },
    update: {},
    create: { id: 'RM_PHY_A_2_139', name: 'CCUห้องแม่บ้าน', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '139' },
    update: {},
    create: { id: 'ASSET_139', qrCode: '139', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_139' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_140' },
    update: {},
    create: { id: 'RM_PHY_A_2_140', name: 'CCUห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '140' },
    update: {},
    create: { id: 'ASSET_140', qrCode: '140', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_140' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_141' },
    update: {},
    create: { id: 'RM_PHY_A_2_141', name: 'CCUห้องเก็บของ', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '141' },
    update: {},
    create: { id: 'ASSET_141', qrCode: '141', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_141' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_142' },
    update: {},
    create: { id: 'RM_PHY_A_2_142', name: 'ห้องคลอด', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '142' },
    update: {},
    create: { id: 'ASSET_142', qrCode: '142', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_142' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_143' },
    update: {},
    create: { id: 'RM_PHY_A_2_143', name: 'ห้องคลอดตรงตู้วางรองเท้า', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '143' },
    update: {},
    create: { id: 'ASSET_143', qrCode: '143', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_143' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_144' },
    update: {},
    create: { id: 'RM_PHY_A_2_144', name: 'ห้องคลอดห้องเก็บผ้า', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '144' },
    update: {},
    create: { id: 'ASSET_144', qrCode: '144', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_144' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_145' },
    update: {},
    create: { id: 'RM_PHY_A_2_145', name: 'ห้องคลอดห้องเก็บของหลังเคาน์เตอร์ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '145' },
    update: {},
    create: { id: 'ASSET_145', qrCode: '145', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_145' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_146' },
    update: {},
    create: { id: 'RM_PHY_A_2_146', name: 'ห้องคลอดห้องเก็บของหลังเคาน์เตอร์ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '146' },
    update: {},
    create: { id: 'ASSET_146', qrCode: '146', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_146' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_147' },
    update: {},
    create: { id: 'RM_PHY_A_2_147', name: 'ห้องคลอดห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '147' },
    update: {},
    create: { id: 'ASSET_147', qrCode: '147', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_147' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_148' },
    update: {},
    create: { id: 'RM_PHY_A_2_148', name: 'ห้องคลอดห้องน้ำ1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '148' },
    update: {},
    create: { id: 'ASSET_148', qrCode: '148', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_148' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_149' },
    update: {},
    create: { id: 'RM_PHY_A_2_149', name: 'ห้องคลอดห้องน้ำ2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '149' },
    update: {},
    create: { id: 'ASSET_149', qrCode: '149', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_149' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_150' },
    update: {},
    create: { id: 'RM_PHY_A_2_150', name: 'ห้องคลอดทางเดินหลังห้องชงนม', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '150' },
    update: {},
    create: { id: 'ASSET_150', qrCode: '150', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_150' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_151' },
    update: {},
    create: { id: 'RM_PHY_A_2_151', name: 'ห้องคลอดทางเดินหลังห้องSupply', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '151' },
    update: {},
    create: { id: 'ASSET_151', qrCode: '151', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_151' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_152' },
    update: {},
    create: { id: 'RM_PHY_A_2_152', name: 'ห้องคลอดห้องSupply', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '152' },
    update: {},
    create: { id: 'ASSET_152', qrCode: '152', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_152' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_153' },
    update: {},
    create: { id: 'RM_PHY_A_2_153', name: 'ห้องคลอด1(ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '153' },
    update: {},
    create: { id: 'ASSET_153', qrCode: '153', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_153' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_154' },
    update: {},
    create: { id: 'RM_PHY_A_2_154', name: 'ห้องคลอด2 (ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '154' },
    update: {},
    create: { id: 'ASSET_154', qrCode: '154', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_154' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_155' },
    update: {},
    create: { id: 'RM_PHY_A_2_155', name: 'ห้องคลินิคนมแม่(ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '155' },
    update: {},
    create: { id: 'ASSET_155', qrCode: '155', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_155' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_156' },
    update: {},
    create: { id: 'RM_PHY_A_2_156', name: 'OR', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '156' },
    update: {},
    create: { id: 'ASSET_156', qrCode: '156', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_156' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_157' },
    update: {},
    create: { id: 'RM_PHY_A_2_157', name: 'ORห้องกินข้าว', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '157' },
    update: {},
    create: { id: 'ASSET_157', qrCode: '157', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_157' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_158' },
    update: {},
    create: { id: 'RM_PHY_A_2_158', name: 'ORห้องนอนเวร1(ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '158' },
    update: {},
    create: { id: 'ASSET_158', qrCode: '158', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_158' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_159' },
    update: {},
    create: { id: 'RM_PHY_A_2_159', name: 'ORห้องนอนเวร2(ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '159' },
    update: {},
    create: { id: 'ASSET_159', qrCode: '159', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_159' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_160' },
    update: {},
    create: { id: 'RM_PHY_A_2_160', name: 'ORห้องน้ำชายตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '160' },
    update: {},
    create: { id: 'ASSET_160', qrCode: '160', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_160' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_161' },
    update: {},
    create: { id: 'RM_PHY_A_2_161', name: 'ORห้องน้ำชายตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '161' },
    update: {},
    create: { id: 'ASSET_161', qrCode: '161', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_161' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_162' },
    update: {},
    create: { id: 'RM_PHY_A_2_162', name: 'ORห้องน้ำหญิงตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '162' },
    update: {},
    create: { id: 'ASSET_162', qrCode: '162', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_162' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_163' },
    update: {},
    create: { id: 'RM_PHY_A_2_163', name: 'ORห้องน้ำหญิงตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '163' },
    update: {},
    create: { id: 'ASSET_163', qrCode: '163', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_163' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_164' },
    update: {},
    create: { id: 'RM_PHY_A_2_164', name: 'ORห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '164' },
    update: {},
    create: { id: 'ASSET_164', qrCode: '164', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_164' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_165' },
    update: {},
    create: { id: 'RM_PHY_A_2_165', name: 'Orหน้าห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '165' },
    update: {},
    create: { id: 'ASSET_165', qrCode: '165', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_165' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_166' },
    update: {},
    create: { id: 'RM_PHY_A_2_166', name: 'ORห้องพักฟื้น', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '166' },
    update: {},
    create: { id: 'ASSET_166', qrCode: '166', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_166' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_167' },
    update: {},
    create: { id: 'RM_PHY_A_2_167', name: 'ORห้องพักฟื้น(ห้องน้ำ)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '167' },
    update: {},
    create: { id: 'ASSET_167', qrCode: '167', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_167' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_168' },
    update: {},
    create: { id: 'RM_PHY_A_2_168', name: 'ORห้องน้ำหน้าห้องพักแพทย์', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '168' },
    update: {},
    create: { id: 'ASSET_168', qrCode: '168', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_168' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_169' },
    update: {},
    create: { id: 'RM_PHY_A_2_169', name: 'OR1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '169' },
    update: {},
    create: { id: 'ASSET_169', qrCode: '169', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_169' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_170' },
    update: {},
    create: { id: 'RM_PHY_A_2_170', name: 'OR2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '170' },
    update: {},
    create: { id: 'ASSET_170', qrCode: '170', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_170' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_171' },
    update: {},
    create: { id: 'RM_PHY_A_2_171', name: 'OR3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '171' },
    update: {},
    create: { id: 'ASSET_171', qrCode: '171', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_171' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_172' },
    update: {},
    create: { id: 'RM_PHY_A_2_172', name: 'OR4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '172' },
    update: {},
    create: { id: 'ASSET_172', qrCode: '172', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_172' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_173' },
    update: {},
    create: { id: 'RM_PHY_A_2_173', name: 'OR5', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '173' },
    update: {},
    create: { id: 'ASSET_173', qrCode: '173', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_173' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_174' },
    update: {},
    create: { id: 'RM_PHY_A_2_174', name: 'OR6', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '174' },
    update: {},
    create: { id: 'ASSET_174', qrCode: '174', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_174' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_175' },
    update: {},
    create: { id: 'RM_PHY_A_2_175', name: 'OR7', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '175' },
    update: {},
    create: { id: 'ASSET_175', qrCode: '175', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_175' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_176' },
    update: {},
    create: { id: 'RM_PHY_A_2_176', name: 'ORห้องล้าง', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '176' },
    update: {},
    create: { id: 'ASSET_176', qrCode: '176', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_176' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_177' },
    update: {},
    create: { id: 'RM_PHY_A_2_177', name: 'ห้องแม่บ้านตรงประตูหลังOR', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '177' },
    update: {},
    create: { id: 'ASSET_177', qrCode: '177', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_177' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_178' },
    update: {},
    create: { id: 'RM_PHY_A_2_178', name: 'ห้องน้ำหญิง(ห้องแม่บ้าน)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '178' },
    update: {},
    create: { id: 'ASSET_178', qrCode: '178', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_178' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_179' },
    update: {},
    create: { id: 'RM_PHY_A_2_179', name: 'ห้องน้ำชายชั้น2ตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '179' },
    update: {},
    create: { id: 'ASSET_179', qrCode: '179', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_179' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_180' },
    update: {},
    create: { id: 'RM_PHY_A_2_180', name: 'ห้องน้ำชายชั้น2ตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '180' },
    update: {},
    create: { id: 'ASSET_180', qrCode: '180', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_180' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_181' },
    update: {},
    create: { id: 'RM_PHY_A_2_181', name: 'ห้องน้ำหญิงชั้น2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '181' },
    update: {},
    create: { id: 'ASSET_181', qrCode: '181', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_181' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_182' },
    update: {},
    create: { id: 'RM_PHY_A_2_182', name: 'ห้องน้ำหญิงชั้น2(ห้องแม่บ้าน)', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '182' },
    update: {},
    create: { id: 'ASSET_182', qrCode: '182', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_182' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_183' },
    update: {},
    create: { id: 'RM_PHY_A_2_183', name: 'CSSD', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '183' },
    update: {},
    create: { id: 'ASSET_183', qrCode: '183', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_183' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_184' },
    update: {},
    create: { id: 'RM_PHY_A_2_184', name: 'ทางเดินหน้าCSSDตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '184' },
    update: {},
    create: { id: 'ASSET_184', qrCode: '184', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_184' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_185' },
    update: {},
    create: { id: 'RM_PHY_A_2_185', name: 'ทางเดินหน้าCSSDตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '185' },
    update: {},
    create: { id: 'ASSET_185', qrCode: '185', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_185' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_186' },
    update: {},
    create: { id: 'RM_PHY_A_2_186', name: 'ทางเดินหน้าCSSDตัวที่3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '186' },
    update: {},
    create: { id: 'ASSET_186', qrCode: '186', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_186' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_187' },
    update: {},
    create: { id: 'RM_PHY_A_2_187', name: 'ทางเดินหน้าCSSDตัวที่4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '187' },
    update: {},
    create: { id: 'ASSET_187', qrCode: '187', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_187' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_188' },
    update: {},
    create: { id: 'RM_PHY_A_2_188', name: 'CSSDห้องเตรียมผ้า', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '188' },
    update: {},
    create: { id: 'ASSET_188', qrCode: '188', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_188' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_189' },
    update: {},
    create: { id: 'RM_PHY_A_2_189', name: 'CSSDห้องผจก.', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '189' },
    update: {},
    create: { id: 'ASSET_189', qrCode: '189', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_189' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_190' },
    update: {},
    create: { id: 'RM_PHY_A_2_190', name: 'CSSDห้องทำงาน ตัวที่ 1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '190' },
    update: {},
    create: { id: 'ASSET_190', qrCode: '190', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_190' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_191' },
    update: {},
    create: { id: 'RM_PHY_A_2_191', name: 'CSSDห้องทำงาน ตัวที่ 2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '191' },
    update: {},
    create: { id: 'ASSET_191', qrCode: '191', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_191' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_192' },
    update: {},
    create: { id: 'RM_PHY_A_2_192', name: 'CSSDห้องทำงาน ตัวที่ 3', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '192' },
    update: {},
    create: { id: 'ASSET_192', qrCode: '192', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_192' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_193' },
    update: {},
    create: { id: 'RM_PHY_A_2_193', name: 'CSSDห้องทำงาน ตัวที่ 4', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '193' },
    update: {},
    create: { id: 'ASSET_193', qrCode: '193', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_193' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_194' },
    update: {},
    create: { id: 'RM_PHY_A_2_194', name: 'CSSDห้องน้ำ1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '194' },
    update: {},
    create: { id: 'ASSET_194', qrCode: '194', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_194' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_195' },
    update: {},
    create: { id: 'RM_PHY_A_2_195', name: 'CSSDห้องน้ำ2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '195' },
    update: {},
    create: { id: 'ASSET_195', qrCode: '195', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_195' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_196' },
    update: {},
    create: { id: 'RM_PHY_A_2_196', name: 'CSSDห้องล้างเครื่องมือผ่าตัดตัวที่1', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '196' },
    update: {},
    create: { id: 'ASSET_196', qrCode: '196', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_196' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_2_197' },
    update: {},
    create: { id: 'RM_PHY_A_2_197', name: 'CSSDห้องล้างเครื่องมือผ่าตัดตัวที่2', floorId: 'FLR_PHY_A_2' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '197' },
    update: {},
    create: { id: 'ASSET_197', qrCode: '197', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_2_197' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_198' },
    update: {},
    create: { id: 'RM_PHY_A_3_198', name: 'EENT หน้าห้องสโตร์1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '198' },
    update: {},
    create: { id: 'ASSET_198', qrCode: '198', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_198' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_199' },
    update: {},
    create: { id: 'RM_PHY_A_3_199', name: 'EENT ห้องOPT.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '199' },
    update: {},
    create: { id: 'ASSET_199', qrCode: '199', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_199' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_200' },
    update: {},
    create: { id: 'RM_PHY_A_3_200', name: 'EENT ห้องทรีทเม๊นต์1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '200' },
    update: {},
    create: { id: 'ASSET_200', qrCode: '200', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_200' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_201' },
    update: {},
    create: { id: 'RM_PHY_A_3_201', name: 'EENT ห้องทรีทเม๊นต์2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '201' },
    update: {},
    create: { id: 'ASSET_201', qrCode: '201', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_201' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_202' },
    update: {},
    create: { id: 'RM_PHY_A_3_202', name: 'EENT ห้องตรวจ5.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '202' },
    update: {},
    create: { id: 'ASSET_202', qrCode: '202', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_202' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_203' },
    update: {},
    create: { id: 'RM_PHY_A_3_203', name: 'EENT ห้องตรวจ6.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '203' },
    update: {},
    create: { id: 'ASSET_203', qrCode: '203', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_203' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_204' },
    update: {},
    create: { id: 'RM_PHY_A_3_204', name: 'สูติ หน้าห้องน้ำAHU1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '204' },
    update: {},
    create: { id: 'ASSET_204', qrCode: '204', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_204' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_205' },
    update: {},
    create: { id: 'RM_PHY_A_3_205', name: 'สูติ หน้าห้องน้ำAHU2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '205' },
    update: {},
    create: { id: 'ASSET_205', qrCode: '205', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_205' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_206' },
    update: {},
    create: { id: 'RM_PHY_A_3_206', name: 'ห้องแยกเชื้อกุมารเวช ทางเชื่อมชั้น3.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '206' },
    update: {},
    create: { id: 'ASSET_206', qrCode: '206', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_206' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_207' },
    update: {},
    create: { id: 'RM_PHY_A_3_207', name: 'ทางเดินหน้าลิฟต์ 7(ร้านกาแฟ).', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '207' },
    update: {},
    create: { id: 'ASSET_207', qrCode: '207', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_207' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_208' },
    update: {},
    create: { id: 'RM_PHY_A_3_208', name: 'ทางเดินหน้าลิฟต์ 10.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '208' },
    update: {},
    create: { id: 'ASSET_208', qrCode: '208', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_208' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_209' },
    update: {},
    create: { id: 'RM_PHY_A_3_209', name: 'ทันตกรรม ห้องตรวจ1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '209' },
    update: {},
    create: { id: 'ASSET_209', qrCode: '209', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_209' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_210' },
    update: {},
    create: { id: 'RM_PHY_A_3_210', name: 'ทันตกรรม ห้องตรวจ2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '210' },
    update: {},
    create: { id: 'ASSET_210', qrCode: '210', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_210' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_211' },
    update: {},
    create: { id: 'RM_PHY_A_3_211', name: 'ทันตกรรม ห้องตรวจ3.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '211' },
    update: {},
    create: { id: 'ASSET_211', qrCode: '211', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_211' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_212' },
    update: {},
    create: { id: 'RM_PHY_A_3_212', name: 'ทันตกรรม ห้องตรวจ4.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '212' },
    update: {},
    create: { id: 'ASSET_212', qrCode: '212', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_212' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_213' },
    update: {},
    create: { id: 'RM_PHY_A_3_213', name: 'ทันตกรรม ห้องตรวจ5.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '213' },
    update: {},
    create: { id: 'ASSET_213', qrCode: '213', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_213' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_214' },
    update: {},
    create: { id: 'RM_PHY_A_3_214', name: 'ทันตกรรม ห้องตรวจ6.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '214' },
    update: {},
    create: { id: 'ASSET_214', qrCode: '214', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_214' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_215' },
    update: {},
    create: { id: 'RM_PHY_A_3_215', name: 'ทันตกรรม ห้องตรวจ7.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '215' },
    update: {},
    create: { id: 'ASSET_215', qrCode: '215', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_215' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_216' },
    update: {},
    create: { id: 'RM_PHY_A_3_216', name: 'ทันตกรรม ห้องตรวจ8.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '216' },
    update: {},
    create: { id: 'ASSET_216', qrCode: '216', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_216' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_217' },
    update: {},
    create: { id: 'RM_PHY_A_3_217', name: 'ทันตกรรม ห้องตรวจ9.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '217' },
    update: {},
    create: { id: 'ASSET_217', qrCode: '217', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_217' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_218' },
    update: {},
    create: { id: 'RM_PHY_A_3_218', name: 'ทันตกรรม ห้องตรวจ10.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '218' },
    update: {},
    create: { id: 'ASSET_218', qrCode: '218', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_218' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_219' },
    update: {},
    create: { id: 'RM_PHY_A_3_219', name: 'ทันตกรรม ห้องตรวจ11.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '219' },
    update: {},
    create: { id: 'ASSET_219', qrCode: '219', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_219' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_220' },
    update: {},
    create: { id: 'RM_PHY_A_3_220', name: 'ทันตกรรม หน้าห้องตรวจ4', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '220' },
    update: {},
    create: { id: 'ASSET_220', qrCode: '220', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_220' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_221' },
    update: {},
    create: { id: 'RM_PHY_A_3_221', name: 'ทันตกรรม หน้าห้องตรวจ8', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '221' },
    update: {},
    create: { id: 'ASSET_221', qrCode: '221', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_221' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_222' },
    update: {},
    create: { id: 'RM_PHY_A_3_222', name: 'ทันตกรรม ห้องSUPPLY.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '222' },
    update: {},
    create: { id: 'ASSET_222', qrCode: '222', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_222' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_223' },
    update: {},
    create: { id: 'RM_PHY_A_3_223', name: 'ทันตกรรม ห้องพักแพทย์.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '223' },
    update: {},
    create: { id: 'ASSET_223', qrCode: '223', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_223' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_224' },
    update: {},
    create: { id: 'RM_PHY_A_3_224', name: 'ทันตกรรม ห้องพักพนักงาน.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '224' },
    update: {},
    create: { id: 'ASSET_224', qrCode: '224', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_224' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_225' },
    update: {},
    create: { id: 'RM_PHY_A_3_225', name: 'ทันตกรรม ห้องLAB.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '225' },
    update: {},
    create: { id: 'ASSET_225', qrCode: '225', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_225' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_226' },
    update: {},
    create: { id: 'RM_PHY_A_3_226', name: 'ทางเดินหายใจเด็ก เคาน์เตอร์.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '226' },
    update: {},
    create: { id: 'ASSET_226', qrCode: '226', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_226' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_227' },
    update: {},
    create: { id: 'RM_PHY_A_3_227', name: 'ทางเดินหายใจเด็ก ห้องตรวจ1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '227' },
    update: {},
    create: { id: 'ASSET_227', qrCode: '227', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_227' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_228' },
    update: {},
    create: { id: 'RM_PHY_A_3_228', name: 'ทางเดินหายใจเด็ก ห้องตรวจ2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '228' },
    update: {},
    create: { id: 'ASSET_228', qrCode: '228', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_228' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_229' },
    update: {},
    create: { id: 'RM_PHY_A_3_229', name: 'ทางเดินหายใจเด็ก ห้องตรวจ3.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '229' },
    update: {},
    create: { id: 'ASSET_229', qrCode: '229', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_229' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_230' },
    update: {},
    create: { id: 'RM_PHY_A_3_230', name: 'ทางเดินหายใจเด็ก ห้องตรวจ4.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '230' },
    update: {},
    create: { id: 'ASSET_230', qrCode: '230', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_230' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_231' },
    update: {},
    create: { id: 'RM_PHY_A_3_231', name: 'ทางเดินหายใจเด็ก ห้องเคาะปอด.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '231' },
    update: {},
    create: { id: 'ASSET_231', qrCode: '231', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_231' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_232' },
    update: {},
    create: { id: 'RM_PHY_A_3_232', name: 'ทางเดินหายใจเด็ก ห้องพ่นยา.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '232' },
    update: {},
    create: { id: 'ASSET_232', qrCode: '232', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_232' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_233' },
    update: {},
    create: { id: 'RM_PHY_A_3_233', name: 'ทางเดินหายใจเด็ก ห้องหัตถการ.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '233' },
    update: {},
    create: { id: 'ASSET_233', qrCode: '233', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_233' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_234' },
    update: {},
    create: { id: 'RM_PHY_A_3_234', name: 'ทางเดินหายใจเด็ก โถงหน้าห้องตรวจ4.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '234' },
    update: {},
    create: { id: 'ASSET_234', qrCode: '234', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_234' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_235' },
    update: {},
    create: { id: 'RM_PHY_A_3_235', name: 'WELL BABY เคาน์เตอร์.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '235' },
    update: {},
    create: { id: 'ASSET_235', qrCode: '235', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_235' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_236' },
    update: {},
    create: { id: 'RM_PHY_A_3_236', name: 'WELL BABY ห้องตรวจ1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '236' },
    update: {},
    create: { id: 'ASSET_236', qrCode: '236', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_236' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_237' },
    update: {},
    create: { id: 'RM_PHY_A_3_237', name: 'WELL BABY ห้องหัตถการ.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '237' },
    update: {},
    create: { id: 'ASSET_237', qrCode: '237', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_237' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_238' },
    update: {},
    create: { id: 'RM_PHY_A_3_238', name: 'WELL BABY ห้องให้นมบุตร.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '238' },
    update: {},
    create: { id: 'ASSET_238', qrCode: '238', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_238' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_239' },
    update: {},
    create: { id: 'RM_PHY_A_3_239', name: 'WELL BABY หน้าห้องตรวจ1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '239' },
    update: {},
    create: { id: 'ASSET_239', qrCode: '239', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_239' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_240' },
    update: {},
    create: { id: 'RM_PHY_A_3_240', name: 'WELL BABY โถงหน้าห้องตรวจ4.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '240' },
    update: {},
    create: { id: 'ASSET_240', qrCode: '240', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_240' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_241' },
    update: {},
    create: { id: 'RM_PHY_A_3_241', name: 'กุมารเวช ห้องตรวจ5.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '241' },
    update: {},
    create: { id: 'ASSET_241', qrCode: '241', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_241' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_242' },
    update: {},
    create: { id: 'RM_PHY_A_3_242', name: 'กุมารเวช ห้องตรวจ6.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '242' },
    update: {},
    create: { id: 'ASSET_242', qrCode: '242', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_242' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_243' },
    update: {},
    create: { id: 'RM_PHY_A_3_243', name: 'กุมารเวช ห้องตรวจ7.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '243' },
    update: {},
    create: { id: 'ASSET_243', qrCode: '243', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_243' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_244' },
    update: {},
    create: { id: 'RM_PHY_A_3_244', name: 'กุมารเวช ห้องตรวจ8.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '244' },
    update: {},
    create: { id: 'ASSET_244', qrCode: '244', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_244' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_245' },
    update: {},
    create: { id: 'RM_PHY_A_3_245', name: 'กุมารเวช ห้องตรวจ9.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '245' },
    update: {},
    create: { id: 'ASSET_245', qrCode: '245', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_245' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_246' },
    update: {},
    create: { id: 'RM_PHY_A_3_246', name: 'กุมารเวชห้องเตรียมวัคซีน', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '246' },
    update: {},
    create: { id: 'ASSET_246', qrCode: '246', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_246' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_247' },
    update: {},
    create: { id: 'RM_PHY_A_3_247', name: 'กุมารเวช โถงกลาง.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '247' },
    update: {},
    create: { id: 'ASSET_247', qrCode: '247', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_247' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_248' },
    update: {},
    create: { id: 'RM_PHY_A_3_248', name: 'กุมารเวช หน้าห้องตรวจ4.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '248' },
    update: {},
    create: { id: 'ASSET_248', qrCode: '248', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_248' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_249' },
    update: {},
    create: { id: 'RM_PHY_A_3_249', name: 'กุมารเวช หน้าห้องตรวจ10.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '249' },
    update: {},
    create: { id: 'ASSET_249', qrCode: '249', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_249' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_250' },
    update: {},
    create: { id: 'RM_PHY_A_3_250', name: 'ห้องเจาะเลือดชั้น3.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '250' },
    update: {},
    create: { id: 'ASSET_250', qrCode: '250', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_250' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_251' },
    update: {},
    create: { id: 'RM_PHY_A_3_251', name: 'INFERTILE โถงหน้าเคาน์เตอร์.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '251' },
    update: {},
    create: { id: 'ASSET_251', qrCode: '251', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_251' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_252' },
    update: {},
    create: { id: 'RM_PHY_A_3_252', name: 'INFERTILE ทางเดินหน้าห้องตรวจ2', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '252' },
    update: {},
    create: { id: 'ASSET_252', qrCode: '252', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_252' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_253' },
    update: {},
    create: { id: 'RM_PHY_A_3_253', name: 'INFERTILE ห้องรับรองด้านใน.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '253' },
    update: {},
    create: { id: 'ASSET_253', qrCode: '253', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_253' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_254' },
    update: {},
    create: { id: 'RM_PHY_A_3_254', name: 'INFERTILE ห้องกินข้าว', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '254' },
    update: {},
    create: { id: 'ASSET_254', qrCode: '254', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_254' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_255' },
    update: {},
    create: { id: 'RM_PHY_A_3_255', name: 'INFERTILE ห้องเก็บของ', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '255' },
    update: {},
    create: { id: 'ASSET_255', qrCode: '255', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_255' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_256' },
    update: {},
    create: { id: 'RM_PHY_A_3_256', name: 'INFERTILE ห้องตรวจ1 ตัวที่1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '256' },
    update: {},
    create: { id: 'ASSET_256', qrCode: '256', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_256' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_257' },
    update: {},
    create: { id: 'RM_PHY_A_3_257', name: 'INFERTILE ห้องตรวจ1 ตัวที่2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '257' },
    update: {},
    create: { id: 'ASSET_257', qrCode: '257', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_257' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_258' },
    update: {},
    create: { id: 'RM_PHY_A_3_258', name: 'INFERTILE ห้องตรวจ1 ตัวที่3.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '258' },
    update: {},
    create: { id: 'ASSET_258', qrCode: '258', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_258' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_259' },
    update: {},
    create: { id: 'RM_PHY_A_3_259', name: 'INFERTILE ห้องตรวจ2 ตัวที่1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '259' },
    update: {},
    create: { id: 'ASSET_259', qrCode: '259', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_259' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_260' },
    update: {},
    create: { id: 'RM_PHY_A_3_260', name: 'INFERTILE ห้องตรวจ2 ตัวที่2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '260' },
    update: {},
    create: { id: 'ASSET_260', qrCode: '260', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_260' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_261' },
    update: {},
    create: { id: 'RM_PHY_A_3_261', name: 'INFERTILE ห้องTreatment.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '261' },
    update: {},
    create: { id: 'ASSET_261', qrCode: '261', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_261' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_262' },
    update: {},
    create: { id: 'RM_PHY_A_3_262', name: 'ห้องก๊าซINFERTILE ตรงที่วางถังก๊าซ', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '262' },
    update: {},
    create: { id: 'ASSET_262', qrCode: '262', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_262' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_263' },
    update: {},
    create: { id: 'RM_PHY_A_3_263', name: 'ห้องก๊าซINFERTILE หน้าห้องPABX', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '263' },
    update: {},
    create: { id: 'ASSET_263', qrCode: '263', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_263' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_264' },
    update: {},
    create: { id: 'RM_PHY_A_3_264', name: 'ห้องPBAX ตัวที่1.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '264' },
    update: {},
    create: { id: 'ASSET_264', qrCode: '264', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_264' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_265' },
    update: {},
    create: { id: 'RM_PHY_A_3_265', name: 'ห้องPBAX ตัวที่2.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '265' },
    update: {},
    create: { id: 'ASSET_265', qrCode: '265', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_265' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_266' },
    update: {},
    create: { id: 'RM_PHY_A_3_266', name: 'โถงหน้าการเงินชั้น3.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '266' },
    update: {},
    create: { id: 'ASSET_266', qrCode: '266', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_266' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_267' },
    update: {},
    create: { id: 'RM_PHY_A_3_267', name: 'ห้องยาชั้น3', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '267' },
    update: {},
    create: { id: 'ASSET_267', qrCode: '267', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_267' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_268' },
    update: {},
    create: { id: 'RM_PHY_A_3_268', name: 'WNC ศูนย์ตรวจสุขภาพ หน้าแผนก.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '268' },
    update: {},
    create: { id: 'ASSET_268', qrCode: '268', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_268' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_269' },
    update: {},
    create: { id: 'RM_PHY_A_3_269', name: 'WNC ศูนย์ตรวจสุขภาพ เคาน์เตอร์.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '269' },
    update: {},
    create: { id: 'ASSET_269', qrCode: '269', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_269' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_270' },
    update: {},
    create: { id: 'RM_PHY_A_3_270', name: 'WNC ศูนย์ตรวจสุขภาพ ห้องตรวจ.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '270' },
    update: {},
    create: { id: 'ASSET_270', qrCode: '270', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_270' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_271' },
    update: {},
    create: { id: 'RM_PHY_A_3_271', name: 'WNC ศูนย์ตรวจสุขภาพ ห้องเจาะเลือด.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '271' },
    update: {},
    create: { id: 'ASSET_271', qrCode: '271', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_271' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_275' },
    update: {},
    create: { id: 'RM_PHY_A_3_275', name: 'ทันตกรรม', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '275' },
    update: {},
    create: { id: 'ASSET_275', qrCode: '275', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_275' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_276' },
    update: {},
    create: { id: 'RM_PHY_A_3_276', name: 'ทันตกรรม', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '276' },
    update: {},
    create: { id: 'ASSET_276', qrCode: '276', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_276' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_277' },
    update: {},
    create: { id: 'RM_PHY_A_3_277', name: 'ทันตกรรมห้องน้ำในห้องพักแพทย์', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '277' },
    update: {},
    create: { id: 'ASSET_277', qrCode: '277', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_277' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_278' },
    update: {},
    create: { id: 'RM_PHY_A_3_278', name: 'ทันตกรรมห้องน้ำพนักงาน', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '278' },
    update: {},
    create: { id: 'ASSET_278', qrCode: '278', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_278' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_279' },
    update: {},
    create: { id: 'RM_PHY_A_3_279', name: 'ทันตกรรมห้องLAB', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '279' },
    update: {},
    create: { id: 'ASSET_279', qrCode: '279', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_279' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_280' },
    update: {},
    create: { id: 'RM_PHY_A_3_280', name: 'ทันตกรรมห้องSupply', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '280' },
    update: {},
    create: { id: 'ASSET_280', qrCode: '280', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_280' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_281' },
    update: {},
    create: { id: 'RM_PHY_A_3_281', name: 'ทางเดินหน้าทางเดินหายใจเด็ก', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '281' },
    update: {},
    create: { id: 'ASSET_281', qrCode: '281', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_281' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_282' },
    update: {},
    create: { id: 'RM_PHY_A_3_282', name: 'ทางเดินหายใจเด็ก', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '282' },
    update: {},
    create: { id: 'ASSET_282', qrCode: '282', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_282' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_283' },
    update: {},
    create: { id: 'RM_PHY_A_3_283', name: 'ทางเดินหายใจเด็ก', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '283' },
    update: {},
    create: { id: 'ASSET_283', qrCode: '283', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_283' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_284' },
    update: {},
    create: { id: 'RM_PHY_A_3_284', name: 'Well baby', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '284' },
    update: {},
    create: { id: 'ASSET_284', qrCode: '284', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_284' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_285' },
    update: {},
    create: { id: 'RM_PHY_A_3_285', name: 'Well baby ห้องน้ำ', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '285' },
    update: {},
    create: { id: 'ASSET_285', qrCode: '285', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_285' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_286' },
    update: {},
    create: { id: 'RM_PHY_A_3_286', name: 'กุมารเวช', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '286' },
    update: {},
    create: { id: 'ASSET_286', qrCode: '286', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_286' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_287' },
    update: {},
    create: { id: 'RM_PHY_A_3_287', name: 'ห้องน้ำชายชั้น3', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '287' },
    update: {},
    create: { id: 'ASSET_287', qrCode: '287', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_287' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_288' },
    update: {},
    create: { id: 'RM_PHY_A_3_288', name: 'ห้องน้ำหญิงชั้น3', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '288' },
    update: {},
    create: { id: 'ASSET_288', qrCode: '288', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_288' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_289' },
    update: {},
    create: { id: 'RM_PHY_A_3_289', name: 'ห้องน้ำคนพิการชั้น3', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '289' },
    update: {},
    create: { id: 'ASSET_289', qrCode: '289', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_289' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_290' },
    update: {},
    create: { id: 'RM_PHY_A_3_290', name: 'Infertile', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '290' },
    update: {},
    create: { id: 'ASSET_290', qrCode: '290', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_290' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_291' },
    update: {},
    create: { id: 'RM_PHY_A_3_291', name: 'WNC', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '291' },
    update: {},
    create: { id: 'ASSET_291', qrCode: '291', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_291' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_292' },
    update: {},
    create: { id: 'RM_PHY_A_3_292', name: 'EENT', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '292' },
    update: {},
    create: { id: 'ASSET_292', qrCode: '292', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_292' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_293' },
    update: {},
    create: { id: 'RM_PHY_A_3_293', name: 'สูติ', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '293' },
    update: {},
    create: { id: 'ASSET_293', qrCode: '293', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_293' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_294' },
    update: {},
    create: { id: 'RM_PHY_A_3_294', name: 'สูติห้องน้ำ', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '294' },
    update: {},
    create: { id: 'ASSET_294', qrCode: '294', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_294' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_295' },
    update: {},
    create: { id: 'RM_PHY_A_3_295', name: 'สูติห้องล้าง', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '295' },
    update: {},
    create: { id: 'ASSET_295', qrCode: '295', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_295' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_296' },
    update: {},
    create: { id: 'RM_PHY_A_3_296', name: 'สูติห้องน้ำผจก.', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '296' },
    update: {},
    create: { id: 'ASSET_296', qrCode: '296', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_296' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_297' },
    update: {},
    create: { id: 'RM_PHY_A_3_297', name: 'ห้องแยกเชื้อกุมารเวช', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '297' },
    update: {},
    create: { id: 'ASSET_297', qrCode: '297', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_297' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_298' },
    update: {},
    create: { id: 'RM_PHY_A_3_298', name: 'หน้าลิฟต์9ตัวที่1', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '298' },
    update: {},
    create: { id: 'ASSET_298', qrCode: '298', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_298' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_299' },
    update: {},
    create: { id: 'RM_PHY_A_3_299', name: 'หน้าลิฟต์9ตัวที่2', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '299' },
    update: {},
    create: { id: 'ASSET_299', qrCode: '299', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_299' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_300' },
    update: {},
    create: { id: 'RM_PHY_A_3_300', name: 'หน้าลิฟต์1,2ตัวที่1', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '300' },
    update: {},
    create: { id: 'ASSET_300', qrCode: '300', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_300' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_301' },
    update: {},
    create: { id: 'RM_PHY_A_3_301', name: 'หน้าลิฟต์1,2ตัวที่2', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '301' },
    update: {},
    create: { id: 'ASSET_301', qrCode: '301', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_301' }
  });
  await prisma.room.upsert({
    where: { id: 'RM_PHY_A_3_302' },
    update: {},
    create: { id: 'RM_PHY_A_3_302', name: 'หน้าลิฟต์1,2ตัวที่3', floorId: 'FLR_PHY_A_3' }
  });
  await prisma.asset.upsert({
    where: { qrCode: '302' },
    update: {},
    create: { id: 'ASSET_302', qrCode: '302', assetType: 'AIR_CONDITIONER', machineType: 'SPLIT_TYPE', status: 'ACTIVE', roomId: 'RM_PHY_A_3_302' }
  });
  const count = await prisma.asset.count();
  console.log('Final Asset Count:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());

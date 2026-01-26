/**
 * Central export file for all server actions
 * Re-exports all actions from domain-specific files
 * 
 * NOTE: This file does NOT have 'use server' because it's just a re-export file.
 * The actual server actions are in the individual files (auth.ts, work-orders.ts, etc.)
 * which have 'use server' directives.
 */

// Work Orders & Job Items
export {
  createMockMaintenance,
  createWorkOrder,
  updateWorkOrderStatus,
  updateWorkOrder,
  deleteWorkOrder,
  assignTechnicianToJobItem,
  updateJobItemStatus,
  deleteJobPhoto,
  createJobPhoto,
  updateJobItemNote,
} from './work-orders'

// Locations (Client, Site, Building, Floor, Room)
export {
  createClient,
  updateClient,
  deleteClient,
  createSite,
  updateSite,
  deleteSite,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createFloor,
  updateFloor,
  deleteFloor,
  createRoom,
  updateRoom,
  deleteRoom,
} from './locations'

// Assets
export {
  createAsset,
  updateAsset,
  deleteAsset,
} from './assets'

// Users
export {
  createUser,
  updateUser,
} from './users'

// Contact
export {
  updateContactInfo,
  submitContactMessage,
  markMessageAsRead,
} from './contact'

// Auth
export {
  login,
  logout,
} from './auth'

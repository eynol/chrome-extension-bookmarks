export const kSyncFolderId = 'sync_folder_id';
export const kSyncVersionId = 'sync_version_id';
export const kSyncRemoteVersionId = 'sync_remote_version_id';


export const kExtensionState = 'local_extension_state';
export const kOriginalSyncPack = 'local_original-sync-pack';
export const kMarkedTreeForReview = 'local_marked-tree-for-review';


export const kProcessing = 'processing';

export enum ExtState {
    'running' = 'running',
    'paused' = 'paused',
    'conflict' = 'conflict',
}

export enum ExtActions {
    'override' = 'override',
    'pauseSync' = 'pauseSync',
    'resumeSync' = 'resumeSync',

    'isInterlvalExist' = 'isInterlvalExist',
}

export enum SyncState {
    NotSynced = 'not_synced',
    Syncing = 'syncing',
    Synced = 'synced',
}

export enum Pages {
    Home = 'home',
    Settings = 'settings',
    Sync = 'sync',
    Manage = 'manage',
}


export interface SyncPackNode {
    id: string;
    title: string;
    url?: string;
    children?: SyncPackNode[];
}
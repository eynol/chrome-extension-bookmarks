export const kSyncFolderId = 'sync_folder_id';
export const kSyncMagicId = 'sync_magic_id';
export const kOriginalRecord = 'sync_original-record';
export const kModifyedRecord = 'sync_original-record';
export const kSyncState = 'sync_state';

export const kProcessing = 'processing';


export enum ExtActions {
    'beginSync' = 'beginSync',
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
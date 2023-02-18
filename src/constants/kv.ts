export const kSyncFolderId = 'sync_folder_id';
export const kSyncVersionId = 'sync_version_id';

export const kOriginalRecord = 'local_original-record';
export const kModifiedRecord = 'local_modified-record';


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
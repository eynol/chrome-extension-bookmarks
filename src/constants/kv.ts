export const kSyncFolderId = 'sync_folder_id';


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
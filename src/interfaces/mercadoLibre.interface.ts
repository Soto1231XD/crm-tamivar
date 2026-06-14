export interface MercadoLibreAccountStatus {
  connected: boolean;
  nickname?: string | null;
  expires_at?: string | null;
}

export interface MercadoLibreAuthUrlResponse {
  authorization_url: string;
}

export interface MercadoLibrePublicationRecord {
  publication_id?: string | null;
  permalink?: string | null;
  status:
    | "not_published"
    | "draft"
    | "active"
    | "paused"
    | "error"
    | "payment_required";
  last_synced_at?: string | null;
  last_error?: string | null;
}

export interface MercadoLibrePropertyStatusResponse {
  account: MercadoLibreAccountStatus;
  publication: MercadoLibrePublicationRecord | null;
}

export interface MercadoLibrePublishResponse {
  message: string;
  publication: MercadoLibrePublicationRecord;
}

export interface MercadoLibreSyncResponse {
  message: string;
  publication: MercadoLibrePublicationRecord;
}

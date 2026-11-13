export interface ClusterConfig {
  apiUrl: string;
  username: string;
  password: string;
}

export interface ClusterAddResponse {
  cid: string;
  name: string;
  size: number;
}

export interface ClusterPinStatus {
  peer_map: Record<string, { status: string }>;
}

import {
  AddAgentRequest,
  AgentResponse,
  ListAgentsParams,
  AgentListResponse,
  AgentDetailResponse,
} from "./types";

export default class MarketplaceAPI {
  private baseUrl: string;

  constructor(
    baseUrl: string = process.env.AGPT_MARKETPLACE_URL ||
      "http://localhost:8000/api"
  ) {
    this.baseUrl = baseUrl;
  }

  async listAgents(params: ListAgentsParams = {}): Promise<AgentListResponse> {
    const queryParams = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
    );
    return this._get(`/agents/agents?${queryParams.toString()}`);
  }

  async getTopDownloadedAgents(
    page: number = 1,
    pageSize: number = 10
  ): Promise<AgentListResponse> {
    return this._get(
      `/agents/top-downloads/agents?page=${page}&page_size=${pageSize}`
    );
  }

  async getAgentDetails(
    id: string,
    version?: number
  ): Promise<AgentDetailResponse> {
    const queryParams = new URLSearchParams();
    if (version) queryParams.append("version", version.toString());
    return this._get(`/agents/agents/${id}?${queryParams.toString()}`);
  }

  async downloadAgent(
    id: string,
    version?: number
  ): Promise<AgentDetailResponse> {
    const queryParams = new URLSearchParams();
    if (version) queryParams.append("version", version.toString());
    return this._get(`/agents/agents/${id}/download?${queryParams.toString()}`);
  }

  async downloadAgentFile(id: string, version?: number): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (version) queryParams.append("version", version.toString());
    return this._getBlob(
      `/agents/${id}/download-file?${queryParams.toString()}`
    );
  }

  async createAgentEntry(request: AddAgentRequest): Promise<AgentResponse> {
    return this._post("/admin/agent", request);
  }

  private async _get(path: string) {
    return this._request("GET", path);
  }

  private async _post(path: string, payload: { [key: string]: any }) {
    return this._request("POST", path, payload);
  }

  private async _getBlob(path: string): Promise<Blob> {
    const response = await fetch(this.baseUrl + path);
    if (!response.ok) {
      const errorData = await response.json();
      console.warn(
        `GET ${path} returned non-OK response:`,
        errorData.detail,
        response
      );
      throw new Error(`HTTP error ${response.status}! ${errorData.detail}`);
    }
    return response.blob();
  }

  private async _request(
    method: "GET" | "POST" | "PUT" | "PATCH",
    path: string,
    payload?: { [key: string]: any }
  ) {
    if (method != "GET") {
      console.debug(`${method} ${path} payload:`, payload);
    }

    const response = await fetch(
      this.baseUrl + path,
      method != "GET"
        ? {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        : undefined
    );
    const response_data = await response.json();

    if (!response.ok) {
      console.warn(
        `${method} ${path} returned non-OK response:`,
        response_data.detail,
        response
      );
      throw new Error(`HTTP error ${response.status}! ${response_data.detail}`);
    }
    return response_data;
  }
}
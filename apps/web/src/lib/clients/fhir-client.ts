import { FHIRResource } from '@/lib/services/ehr-integration';

export interface FHIRClientConfig {
  baseUrl: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  authType: 'bearer' | 'basic' | 'oauth2';
  timeout?: number;
}

export interface FHIRSearchParams {
  resourceType: string;
  params?: Record<string, string | string[]>;
  count?: number;
  offset?: number;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'searchset' | 'collection' | 'document';
  total?: number;
  entry?: Array<{
    resource: FHIRResource;
    fullUrl?: string;
  }>;
  link?: Array<{
    relation: string;
    url: string;
  }>;
}

export class FHIRClient {
  private config: FHIRClientConfig;
  private authToken?: string;

  constructor(config: FHIRClientConfig) {
    this.config = config;
    this.authToken = config.accessToken;
  }

  /**
   * Get a single FHIR resource by ID
   */
  async getResource(resourceType: string, id: string): Promise<FHIRResource | null> {
    try {
      const url = `${this.config.baseUrl}/fhir/R4/${resourceType}/${id}`;
      const response = await this.makeRequest('GET', url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`FHIR API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get ${resourceType}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Search for FHIR resources
   */
  async searchResources(params: FHIRSearchParams): Promise<FHIRBundle> {
    try {
      const searchParams = new URLSearchParams();

      if (params.params) {
        Object.entries(params.params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
          } else {
            searchParams.append(key, value);
          }
        });
      }

      if (params.count) {
        searchParams.append('_count', params.count.toString());
      }

      if (params.offset) {
        searchParams.append('_offset', params.offset.toString());
      }

      const url = `${this.config.baseUrl}/fhir/R4/${params.resourceType}?${searchParams.toString()}`;
      const response = await this.makeRequest('GET', url);

      if (!response.ok) {
        throw new Error(`FHIR search error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to search ${params.resourceType}:`, error);
      throw error;
    }
  }

  /**
   * Create a new FHIR resource
   */
  async createResource(resource: FHIRResource): Promise<FHIRResource> {
    try {
      const url = `${this.config.baseUrl}/fhir/R4/${resource.resourceType}`;
      const response = await this.makeRequest('POST', url, resource);

      if (!response.ok) {
        throw new Error(`FHIR create error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to create ${resource.resourceType}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing FHIR resource
   */
  async updateResource(resource: FHIRResource): Promise<FHIRResource> {
    try {
      const url = `${this.config.baseUrl}/fhir/R4/${resource.resourceType}/${resource.id}`;
      const response = await this.makeRequest('PUT', url, resource);

      if (!response.ok) {
        throw new Error(`FHIR update error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to update ${resource.resourceType}/${resource.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a FHIR resource
   */
  async deleteResource(resourceType: string, id: string): Promise<void> {
    try {
      const url = `${this.config.baseUrl}/fhir/R4/${resourceType}/${id}`;
      const response = await this.makeRequest('DELETE', url);

      if (!response.ok) {
        throw new Error(`FHIR delete error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${resourceType}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Get patients with pagination
   */
  async getPatients(params?: {
    name?: string;
    birthDate?: string;
    identifier?: string;
    count?: number;
    offset?: number;
  }): Promise<FHIRBundle> {
    const searchParams: Record<string, string> = {};

    if (params?.name) searchParams.name = params.name;
    if (params?.birthDate) searchParams.birthdate = params.birthDate;
    if (params?.identifier) searchParams.identifier = params.identifier;

    return this.searchResources({
      resourceType: 'Patient',
      params: searchParams,
      count: params?.count,
      offset: params?.offset
    });
  }

  /**
   * Get encounters for a patient
   */
  async getPatientEncounters(patientId: string, params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    count?: number;
  }): Promise<FHIRBundle> {
    const searchParams: Record<string, string> = {
      patient: patientId
    };

    if (params?.status) searchParams.status = params.status;
    if (params?.dateFrom && params?.dateTo) {
      searchParams.date = `ge${params.dateFrom}&date=le${params.dateTo}`;
    } else if (params?.dateFrom) {
      searchParams.date = `ge${params.dateFrom}`;
    } else if (params?.dateTo) {
      searchParams.date = `le${params.dateTo}`;
    }

    return this.searchResources({
      resourceType: 'Encounter',
      params: searchParams,
      count: params?.count
    });
  }

  /**
   * Get observations for a patient
   */
  async getPatientObservations(patientId: string, params?: {
    category?: string;
    code?: string;
    dateFrom?: string;
    dateTo?: string;
    count?: number;
  }): Promise<FHIRBundle> {
    const searchParams: Record<string, string> = {
      patient: patientId
    };

    if (params?.category) searchParams.category = params.category;
    if (params?.code) searchParams.code = params.code;
    if (params?.dateFrom && params?.dateTo) {
      searchParams.date = `ge${params.dateFrom}&date=le${params.dateTo}`;
    }

    return this.searchResources({
      resourceType: 'Observation',
      params: searchParams,
      count: params?.count
    });
  }

  /**
   * Test connection to FHIR server
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/fhir/R4/metadata`;
      const response = await this.makeRequest('GET', url);
      return response.ok;
    } catch (error) {
      console.error('FHIR connection test failed:', error);
      return false;
    }
  }

  /**
   * Get server capabilities
   */
  async getCapabilityStatement(): Promise<any> {
    try {
      const url = `${this.config.baseUrl}/fhir/R4/metadata`;
      const response = await this.makeRequest('GET', url);

      if (!response.ok) {
        throw new Error(`Failed to get capability statement: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get capability statement:', error);
      throw error;
    }
  }

  /**
   * Perform bulk data export
   */
  async exportData(params?: {
    type?: string;
    since?: string;
    outputFormat?: string;
  }): Promise<{ statusUrl: string }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.append('_type', params.type);
      if (params?.since) searchParams.append('_since', params.since);
      if (params?.outputFormat) searchParams.append('_outputFormat', params.outputFormat);

      const url = `${this.config.baseUrl}/fhir/R4/$export?${searchParams.toString()}`;
      const response = await this.makeRequest('GET', url, null, {
        'Accept': 'application/fhir+json',
        'Prefer': 'respond-async'
      });

      if (response.status !== 202) {
        throw new Error(`Bulk export failed: ${response.status}`);
      }

      const statusUrl = response.headers.get('Content-Location');
      if (!statusUrl) {
        throw new Error('No status URL returned from bulk export');
      }

      return { statusUrl };
    } catch (error) {
      console.error('Bulk export failed:', error);
      throw error;
    }
  }

  /**
   * Check bulk export status
   */
  async checkExportStatus(statusUrl: string): Promise<any> {
    try {
      const response = await this.makeRequest('GET', statusUrl);

      if (response.status === 202) {
        return { status: 'in-progress' };
      } else if (response.status === 200) {
        const result = await response.json();
        return { status: 'completed', data: result };
      } else {
        throw new Error(`Export status check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Export status check failed:', error);
      throw error;
    }
  }

  /**
   * Make authenticated HTTP request to FHIR server
   */
  private async makeRequest(
    method: string,
    url: string,
    body?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/fhir+json',
      'Content-Type': 'application/fhir+json',
      ...additionalHeaders
    };

    // Add authentication
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else if (this.config.authType === 'basic' && this.config.clientId && this.config.clientSecret) {
      const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const requestInit: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 30000)
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      requestInit.body = JSON.stringify(body);
    }

    return fetch(url, requestInit);
  }

  /**
   * Update access token for authentication
   */
  updateAccessToken(token: string): void {
    this.authToken = token;
  }
}

/**
 * Factory function to create FHIR clients for common EHR systems
 */
export class FHIRClientFactory {
  /**
   * Create Epic FHIR client
   */
  static createEpicClient(config: {
    baseUrl: string;
    clientId: string;
    privateKey?: string;
    accessToken?: string;
  }): FHIRClient {
    return new FHIRClient({
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
      clientId: config.clientId,
      authType: 'oauth2',
      timeout: 30000
    });
  }

  /**
   * Create Cerner FHIR client
   */
  static createCernerClient(config: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    accessToken?: string;
  }): FHIRClient {
    return new FHIRClient({
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authType: 'oauth2',
      timeout: 30000
    });
  }

  /**
   * Create Allscripts FHIR client
   */
  static createAllscriptsClient(config: {
    baseUrl: string;
    accessToken: string;
  }): FHIRClient {
    return new FHIRClient({
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
      authType: 'bearer',
      timeout: 30000
    });
  }

  /**
   * Create generic FHIR client
   */
  static createGenericClient(config: FHIRClientConfig): FHIRClient {
    return new FHIRClient(config);
  }
}

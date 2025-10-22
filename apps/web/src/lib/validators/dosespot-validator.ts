interface DosespotCredentials {
  apiKey: string;
  clinicKey: string;
  clinicId: string;
  userId: string;
  subscriptionKey: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

export class DosespotCredentialValidator {
  private getBaseUrl(environment: string): string {
    return environment === 'production'
      ? 'https://api.dosespot.com'
      : 'https://sandbox-api.dosespot.com';
  }

  private async fetchTimeout(
    url: string,
    ms: number,
    options: { signal?: AbortSignal; [key: string]: any } = {}
  ) {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...options });
    if (options.signal) options.signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
  }

  private buildHeaders(credentials: DosespotCredentials): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': credentials.apiKey,
      'x-clinic-key': credentials.clinicKey,
      'x-clinic-id': credentials.clinicId,
      'x-user-id': credentials.userId,
      'x-subscription-key': credentials.subscriptionKey,
    };
  }

  async validate(credentials: DosespotCredentials, environment = 'sandbox'): Promise<ValidationResult> {
    try {
      // Validate credential format first
      const formatValidation = this.validateCredentialFormat(credentials);
      if (!formatValidation.isValid) {
        return formatValidation;
      }

      // Test actual API connection
      const connectionValidation = await this.testApiConnection(credentials, environment);
      return connectionValidation;
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  private validateCredentialFormat(credentials: DosespotCredentials): ValidationResult {
    const requiredFields = ['apiKey', 'clinicKey', 'clinicId', 'userId', 'subscriptionKey'];
    const missingFields = requiredFields.filter(field => !credentials[field as keyof DosespotCredentials]);

    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    // Validate field formats
    if (credentials.apiKey.length < 10) {
      return {
        isValid: false,
        error: 'API key appears to be invalid (too short)',
      };
    }

    if (credentials.clinicKey.length < 10) {
      return {
        isValid: false,
        error: 'Clinic key appears to be invalid (too short)',
      };
    }

    if (!/^\d+$/.test(credentials.clinicId)) {
      return {
        isValid: false,
        error: 'Clinic ID must be numeric',
      };
    }

    if (!/^\d+$/.test(credentials.userId)) {
      return {
        isValid: false,
        error: 'User ID must be numeric',
      };
    }

    return { isValid: true };
  }

  private async testApiConnection(credentials: DosespotCredentials, environment: string): Promise<ValidationResult> {
    const baseUrl = this.getBaseUrl(environment);
    const headers = this.buildHeaders(credentials);

    const controller = new AbortController();
    const { signal } = controller;

    try {
      // Test with a simple API call that should work with valid credentials
      // Using the clinic info endpoint as it's typically accessible and low-impact
      const response = await this.fetchTimeout(`${baseUrl}/v2/clinics/${credentials.clinicId}`, 10000, {
        method: 'GET',
        headers,
        signal
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: !!data,
          details: {
            clinicId: credentials.clinicId,
            responseTime: Date.now(),
            environment,
          },
        };
      }

      // Handle specific error responses
      if (response.status === 401) {
        return {
          isValid: false,
          error: 'Authentication failed - please check your API credentials',
        };
      }

      if (response.status === 403) {
        return {
          isValid: false,
          error: 'Access forbidden - credentials may not have sufficient permissions',
        };
      }

      if (response.status === 404) {
        return {
          isValid: false,
          error: 'Clinic not found - please check your clinic ID',
        };
      }

      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        isValid: false,
        error: `API returned error ${response.status}: ${errorText}`,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          isValid: false,
          error: 'Request timeout - DoseSpot API did not respond within 10 seconds',
        };
      }

      if (error instanceof Error && 'code' in error ? (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') : false) {
        return {
          isValid: false,
          error: 'Network error - unable to connect to DoseSpot API',
        };
      }

      return {
        isValid: false,
        error: `Connection error: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async validateEpaCapability(credentials: DosespotCredentials, environment: string): Promise<ValidationResult> {
    const baseUrl = this.getBaseUrl(environment);
    const headers = this.buildHeaders(credentials);

    const controller = new AbortController();
    const { signal } = controller;

    try {
      // Test EPA-specific endpoint
      const response = await this.fetchTimeout(`${baseUrl}/v2/eligibilities`, 10000, {
        method: 'GET',
        headers,
        signal
      });

      if (response.ok) {
        return {
          isValid: true,
          details: {
            epaEnabled: true,
            environment,
          },
        };
      }

      return {
        isValid: false,
        error: `EPA capability validation failed with status ${response.status}`,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `EPA validation error: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async validateErxCapability(credentials: DosespotCredentials, environment: string): Promise<ValidationResult> {
    const baseUrl = this.getBaseUrl(environment);
    const headers = this.buildHeaders(credentials);

    const controller = new AbortController();
    const { signal } = controller;

    try {
      // Test eRx-specific endpoint
      const response = await this.fetchTimeout(`${baseUrl}/v2/prescriptions`, 10000, {
        method: 'GET',
        headers,
        signal
      });

      if (response.ok) {
        return {
          isValid: true,
          details: {
            erxEnabled: true,
            environment,
          },
        };
      }

      return {
        isValid: false,
        error: `eRx capability validation failed with status ${response.status}`,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `eRx validation error: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  async validateFullCapabilities(credentials: DosespotCredentials, environment: string): Promise<ValidationResult> {
    try {
      const basicValidation = await this.validate(credentials, environment);
      if (!basicValidation.isValid) {
        return basicValidation;
      }

      const [epaResult, erxResult] = await Promise.all([
        this.validateEpaCapability(credentials, environment),
        this.validateErxCapability(credentials, environment),
      ]);

      return {
        isValid: true,
        details: {
          basicConnection: true,
          epaCapability: epaResult.isValid,
          erxCapability: erxResult.isValid,
          environment,
          validatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Full capability validation error: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }
}

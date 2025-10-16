/**
 * Polyfills for Node.js environment
 * This file should be imported at the top of your Next.js app to ensure
 * browser APIs are available during server-side rendering
 */

// DOMParser polyfill for AWS SDK XML parsing
import { DOMParser as XDOMParser } from '@xmldom/xmldom';

if (typeof globalThis !== 'undefined' && !globalThis.DOMParser) {
  globalThis.DOMParser = XDOMParser as any;
}

// Export for explicit imports if needed
export { XDOMParser as DOMParser };

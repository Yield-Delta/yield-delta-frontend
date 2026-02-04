// TypeScript declarations for window object extensions

// Custom type for our extended NEXT_DATA usage
export interface CustomNextData {
  env?: {
    NEXT_PUBLIC_ENABLE_3D_VISUALIZATION?: string;
    [key: string]: string | undefined;
  };
  props?: Record<string, unknown>;
  page?: string;
  query?: Record<string, unknown>;
  buildId?: string;
  assetPrefix?: string;
  runtimeConfig?: Record<string, unknown>;
  nextExport?: boolean;
  autoExport?: boolean;
  isFallback?: boolean;
  dynamicIds?: string[];
  err?: Error;
  gsp?: boolean;
  gssp?: boolean;
  customServer?: boolean;
  gip?: boolean;
  appGip?: boolean;
  head?: Array<React.ReactElement>;
}

// Helper function for type-safe access to custom __NEXT_DATA__ properties
export function getCustomNextData(): CustomNextData {
  return (window as Window & { __NEXT_DATA__: CustomNextData }).__NEXT_DATA__;
}
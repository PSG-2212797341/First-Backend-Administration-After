declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    
    // API
    API_PREFIX?: string;
    
    // Logging
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
    
    // Database (example)
    DATABASE_URL?: string;
    
    // Authentication (example)
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    
    // Application
    APP_NAME?: string;
    APP_VERSION?: string;
    
    // Add other environment variables as needed
    [key: string]: string | undefined;
  }
}

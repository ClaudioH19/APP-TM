import { env } from './env';

export interface AppConfig {
  env: string;
  port: number;
  isDev: boolean;
  isProd: boolean;
}

export const appConfig: AppConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production'
};

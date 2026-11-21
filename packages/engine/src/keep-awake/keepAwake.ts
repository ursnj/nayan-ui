import { appServicesAvailable, requestAppService } from '../native/appServices';
export const keepAwake = {
  isAvailable: appServicesAvailable,
  /** Idempotent per tag. Different owners cannot release each other's requests. */
  async activate(tag = 'default'): Promise<void> {
    await requestAppService({ action: 'awake.activate', tag });
  },
  async deactivate(tag = 'default'): Promise<void> {
    await requestAppService({ action: 'awake.deactivate', tag });
  }
};

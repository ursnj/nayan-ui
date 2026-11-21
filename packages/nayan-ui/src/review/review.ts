import { appServicesAvailable, requestAppService } from '../native/appServices';
export const review = {
  async isAvailable(): Promise<boolean> {
    return appServicesAvailable() && requestAppService<boolean>({ action: 'review.available' });
  },
  /** Resolves when requested. Stores decide whether to actually show a prompt. */
  async requestReview(): Promise<void> {
    await requestAppService({ action: 'review.request' });
  }
};

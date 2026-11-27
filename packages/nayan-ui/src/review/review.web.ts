export const review = {
  async isAvailable(): Promise<boolean> {
    return false;
  },
  async requestReview(): Promise<void> {
    throw new Error('Native store review is unavailable in browsers; provide a store link in the host');
  }
};

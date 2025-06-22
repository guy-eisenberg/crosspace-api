export const R = {
  space: (spaceId: string) => ({
    devices: `space-${spaceId}-devices`,
    files: `space-${spaceId}-files`,
    otp: `space-${spaceId}-otp`,
    token: `space-${spaceId}-token`,
  }),
  otp: (otp: string) => ({
    space: `otp-${otp}-space`,
  }),
  device: (deviceId: string) => `device-${deviceId}`,
};

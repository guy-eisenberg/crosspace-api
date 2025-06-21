export const R = {
  space: (spaceId: string) => ({
    totp_key: `space-${spaceId}-totp-key`,
    devices: `space-${spaceId}-devices`,
    files: `space-${spaceId}-files`,
    otp: `space-${spaceId}-otp`,
  }),
  otp: (otp: string) => ({
    space: `otp-${otp}-space`,
  }),
  device: (deviceId: string) => `device-${deviceId}`,
};

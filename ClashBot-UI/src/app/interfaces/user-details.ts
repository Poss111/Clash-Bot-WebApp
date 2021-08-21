export interface UserDetails {
  id: string,
  username: string,
  discriminator: string,
  avatar?: string,
  bot?: boolean,
  system?: boolean,
  mfa_enabled?: boolean,
  locale?: string,
  verified?: boolean,
  email?: string,
  flags?: Number,
  premium_type?: Number,
  public_flags?: Number
}

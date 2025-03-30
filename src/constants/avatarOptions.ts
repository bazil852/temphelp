export const AGE_OPTIONS = [
    "Young Adult",
    "Early Middle Age",
    "Late Middle Age",
    "Senior",
    "Unspecified"
  ] as const;
  
  export const GENDER_OPTIONS = [
    "Woman",
    "Man",
  ] as const;
  
  export const ETHNICITY_OPTIONS = [
    "White",
    "Black",
    "South Asian",
    "South East Asian",
    "Asian American",
    "East Asian",
    "Middle Eastern",
    "Hispanic"
  ] as const;
  
  export const ORIENTATION_OPTIONS = [
    "square",
    "horizontal",
    "vertical"
  ] as const;
  
  export const POSE_OPTIONS = [
    "half_body",
    "close_up",
    "full_body"
  ] as const;
  
  export const STYLE_OPTIONS = [
    "Realistic",
    "Pixar",
    "Cinematic",
  ] as const;
  
  export type AgeOption = typeof AGE_OPTIONS[number];
  export type GenderOption = typeof GENDER_OPTIONS[number];
  export type EthnicityOption = typeof ETHNICITY_OPTIONS[number];
  export type OrientationOption = typeof ORIENTATION_OPTIONS[number];
  export type PoseOption = typeof POSE_OPTIONS[number];
  export type StyleOption = typeof STYLE_OPTIONS[number];
  
  export interface AvatarFormData {
    name: string;
    age: AgeOption;
    gender: GenderOption;
    ethnicity: EthnicityOption;
    orientation: OrientationOption;
    pose: PoseOption;
    style: StyleOption;
    appearance: string;
    voiceDetails?: string;
  }
// JSON Resume schema — https://jsonresume.org/schema
export interface JsonResumeLocation {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface JsonResumeProfile {
  network: string;
  username?: string;
  url?: string;
}

export interface JsonResumeBasics {
  name: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: JsonResumeLocation;
  profiles?: JsonResumeProfile[];
}

export interface JsonResumeWork {
  name: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface JsonResumeEducation {
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface JsonResumeSkill {
  name: string;
  level?: string;
  keywords?: string[];
}

export interface JsonResumeLanguage {
  language: string;
  fluency?: string;
}

export interface JsonResumeCertificate {
  name: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export interface JsonResumeProject {
  name: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
}

export interface JsonResume {
  basics: JsonResumeBasics;
  work?: JsonResumeWork[];
  education?: JsonResumeEducation[];
  skills?: JsonResumeSkill[];
  languages?: JsonResumeLanguage[];
  certificates?: JsonResumeCertificate[];
  projects?: JsonResumeProject[];
}

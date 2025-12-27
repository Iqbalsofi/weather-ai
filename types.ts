
export interface WeatherData {
  city: string;
  temperature: string;
  condition: string;
  landmarkName: string;
  landmarkDescription: string;
  sources: { uri: string; title: string; type: 'web' | 'maps' }[];
  backgroundImageUrl?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

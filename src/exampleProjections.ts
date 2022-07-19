interface Example {
  label: string;
  proj4: string;
  latRangeMin: number;
  latRangeMax: number;
  lonRangeMin: number;
  lonRangeMax: number;
  step: number;
}

const fullBbox = {
  latRangeMin: -90,
  latRangeMax: 90,
  lonRangeMin: -180,
  lonRangeMax: 180,
  step: 1
}

export function getProjectionExamples(): Example[] {
  return [
    { ...fullBbox, label: 'UTM Zone 32', proj4: '+proj=utm +zone=32' },
    { ...fullBbox, label: 'Geostationary Orbit', proj4: '+proj=geos +h=35785831.0 +lon_0=-60 +sweep=y' },
    { ...fullBbox, label: 'EPSG:27700 - British National Grid', proj4: '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs'}
  ]
}

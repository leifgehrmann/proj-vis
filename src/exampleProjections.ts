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
  step: 1,
};

const gnomonicBbox = {
  latRangeMin: 45,
  latRangeMax: 90,
  lonRangeMin: -180,
  lonRangeMax: 180,
  step: 0.5,
};

const krovakBbox = {
  latRangeMin: 30,
  latRangeMax: 60,
  lonRangeMin: -5,
  lonRangeMax: 55,
  step: 0.25,
};

const stereBbox = {
  latRangeMin: -90,
  latRangeMax: 10,
  lonRangeMin: -180,
  lonRangeMax: 180,
  step: 1,
};

const lccBbox = {
  latRangeMin: -45,
  latRangeMax: 90,
  lonRangeMin: -180,
  lonRangeMax: 180,
  step: 1,
};

const somercBbox = {
  latRangeMin: -90,
  latRangeMax: 90,
  lonRangeMin: -90,
  lonRangeMax: 90,
  step: 1,
};

const nzmgBbox = {
  latRangeMin: -57,
  latRangeMax: -12,
  lonRangeMin: 140,
  lonRangeMax: 204,
  step: 0.25,
};

const aeqdBbox = {
  latRangeMin: -90,
  latRangeMax: 90,
  lonRangeMin: -90,
  lonRangeMax: 90,
  step: 1,
};

const laeaBbox = {
  latRangeMin: -90,
  latRangeMax: 90,
  lonRangeMin: -164.5,
  lonRangeMax: 194.5,
  step: 1,
};

export function getProjectionExamples(): Record<string, Example> {
  return {
    // Conic
    aea: { ...fullBbox, label: 'Albers Equal Area', proj4: '+proj=aea +lat_1=30 +lat_2=50 +lon_0=0 +lat_0=0 +x_0=0 +y_0=0' },
    eqdc: { ...fullBbox, label: 'Equidistant Conic', proj4: '+proj=eqdc +lat_0=0 +lon_0=0 +lat_1=43 +lat_2=62 +x_0=0 +y_0=0 +ellps=intl +units=m no_defs' },
    krovak: { ...krovakBbox, label: 'Křovák (Czechoslovakia)', proj4: '+proj=krovak +lat_0=0 +lon_0=0 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +pm=greenwich +units=m +no_defs +towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56' },
    lcc: { ...lccBbox, label: 'Lambert Conformal Conic', proj4: '+proj=lcc +lat_1=50 +lat_2=0 +lat_0=90 +lon_0=0 +x_0=0 +y_0=0' },
    // Psuedoconical
    poly: { ...fullBbox, label: 'Polyconic (America)', proj4: '+proj=poly +lat_0=0 +lon_0=0 +x_0=0 +y_0=0' },
    // Azimuthal
    ortho: { ...fullBbox, label: 'Orthographic', proj4: '+proj=ortho +lat_0=30 +lon_0=-80 +x_0=0 +y_0=0' },
    geos: { ...fullBbox, label: 'Geostationary Orbit', proj4: '+proj=geos +h=35785831.0 +lon_0=-60 +sweep=y' },
    aeqd: { ...aeqdBbox, label: 'Azimuthal Equidistant', proj4: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs' },
    laea: { ...laeaBbox, label: 'Lambert Azimuthal Equal Area', proj4: '+proj=laea +lat_0=42 +lon_0=15 +x_0=0 +y_0=0  +units=m' },
    qsc: { ...fullBbox, label: 'Quadrilateralized Spherical Cube', proj4: '+proj=qsc +lon_0=0 +units=m +datum=WGS84' },
    stere: { ...stereBbox, label: 'Stereographic', proj4: '+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +units=m' },
    sterea: { ...stereBbox, label: 'Oblique Stereographic Alternative', proj4: '+proj=sterea +lat_0=-80 +lon_0=0 +x_0=0 +y_0=0 +units=m' },
    tpers: { ...fullBbox, label: 'Tilted Perspective', proj4: '+proj=tpers +lon_0=0 +a=6400000 +h=10000000 +azi=0 +tilt=0' },
    // Transverse and oblique cylindrical
    cass: { ...fullBbox, label: 'Cassini (Cassini-Soldner)', proj4: '+proj=cass +lat_0=0 +lon_0=0 +x_0=0 +y_0=0' },
    // Cylindrical
    cea: { ...fullBbox, label: 'Equal Area Cylindrical', proj4: '+proj=cea +lon_0=0 +lat_ts=45 +x_0=0 +y_0=0' },
    mill: { ...fullBbox, label: 'Miller Cylindrical', proj4: '+proj=mill +lat_0=0 +lon_0=0 +x_0=0 +y_0=0' },
    // Conformal cylindrical
    eqc: { ...fullBbox, label: 'Equidistant Cylindrical (Plate Carrée)', proj4: '+proj=eqc +lat_0=0 +lon_0=0 +x_0=0 +y_0=0' },
    longlat: { ...fullBbox, label: 'Long/Lat', proj4: '+proj=longlat +lat_0=0 +lon_0=0 +x_0=0 +y_0=0' },
    merc: { ...fullBbox, label: 'Mercator', proj4: '+proj=merc +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +towgs84=0,0,0,1,1,1,0' },
    tmerc: { ...fullBbox, label: 'Transverse Mercator (EPSG:27700 - British National Grid)', proj4: '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs' },
    utm: { ...fullBbox, label: 'Universal Transverse Mercator (UTM)', proj4: '+proj=utm +zone=32' },
    omerc: { ...fullBbox, label: 'Oblique Mercator', proj4: '+proj=omerc +lat_0=0 +lonc=0 +alpha=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' },
    // Pseudocylindrical
    gnom: { ...gnomonicBbox, label: 'Gnomonic', proj4: '+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs' },
    moll: { ...fullBbox, label: 'Mollweide', proj4: '+proj=moll +lon_0=150 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs' },
    robin: { ...fullBbox, label: 'Robinson', proj4: '+proj=robin +a=6400000' },
    eqearth: { ...fullBbox, label: 'Equal Earth', proj4: '+proj=eqearth +lon_0=0 +x_0=0 +y_0=0' },
    sinu: { ...fullBbox, label: 'Sinusoidal (Sanson-Flamsteed)', proj4: '+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs' },
    // Other
    nzmg: { ...nzmgBbox, label: 'New Zealand Map Grid', proj4: '+proj=nzmg +lat_0=-41 +lon_0=173 +x_0=0 +y_0=0' },
    somerc: { ...somercBbox, label: 'Swiss Oblique Mercator', proj4: '+proj=somerc +lat_0=0 +lon_0=0 +x_0=0 +y_0=0' },
    vandg: { ...fullBbox, label: 'van der Grinten', proj4: '+proj=vandg +lon_0=0 +x_0=0 +y_0=0' },
  };
}

export function getProjectionExampleOptions(): { label: string, options: string[] }[] {
  return [
    {
      label: 'Conic',
      options: [
        'aea',
        'eqdc',
        'krovak',
        'lcc',
      ],
    },
    {
      label: 'Psuedoconical',
      options: [
        'poly',
      ],
    },
    {
      label: 'Azimuthal',
      options: [
        'ortho',
        'geos',
        'aeqd',
        'laea',
        'qsc',
        'stere',
        'sterea',
        'tpers',
      ],
    },
    {
      label: 'Cylindrical',
      options: [
        'cea',
        'mill',
        'cass',
      ],
    },
    {
      label: 'Conformal cylindrical',
      options: [
        'eqc',
        'longlat',
        'merc',
        'tmerc',
        'utm',
        'omerc',
      ],
    },
    {
      label: 'Pseudo-cylindrical',
      options: [
        'gnom',
        'moll',
        'robin',
        'eqearth',
        'sinu',
      ],
    },
    {
      label: 'Other',
      options: [
        'nzmg',
        'somerc',
        'vandg',
      ],
    },
  ];
}

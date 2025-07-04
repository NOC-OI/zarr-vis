import { mercatorInvert } from 'glsl-geo-projection';

const _sh = mode => {
  return (value, which) => {
    if (which.includes(mode)) return value;
    return '';
  };
};

export const vert = (mode, vars) => {
  const sh = _sh(mode);

  return `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  #define PI 3.1415926535897932384626433832795

  attribute vec2 position;
  ${sh(`varying vec2 uv;`, ['texture'])}
  ${sh(vars.map(d => `attribute float ${d};`).join(''), ['grid', 'dotgrid'])}
  ${sh(vars.map(d => `varying float ${d}v;`).join(''), ['grid', 'dotgrid'])}
  uniform vec2 camera;
  uniform float viewportWidth;
  uniform float viewportHeight;
  uniform float pixelRatio;
  uniform float zoom;
  uniform float size;
  uniform float globalLevel;
  uniform float level;
  uniform vec2 offset;
  uniform vec2 order;
  uniform float projection;
  varying float latBase;
  float mercatorYFromLat(float phi)
  {
    return (PI - log(tan(PI / 4.0 - phi / 2.0))) / (2.0 * PI);
  }

  void main() {
    float scale = pixelRatio * 512.0 / size;
    float globalMag = pow(2.0, zoom - globalLevel);
    float mag = pow(2.0, zoom - level);

    vec2 tileOffset = mag * (position + offset * size);
    vec2 cameraOffset = globalMag * camera * size;
    vec2 scaleFactor = vec2(order.x / viewportWidth, -1.0 * order.y / viewportHeight) * scale * 2.0;

    float x = scaleFactor.x * (tileOffset.x - cameraOffset.x);

    float y;
    // Equirectangular
    if (projection == 1.0) {
      float numTiles = pow(2.0, level);
      float sizeRad = PI / numTiles;
      float stepRad = sizeRad / size;
      float latRad = order.y * (PI / 2.0 - (offset.y * sizeRad + position.y * stepRad));

      // (0 => 1)
      float posY = clamp(mercatorYFromLat(latRad), 0.0, 1.0);
      // (-0.5 => 0.5)
      posY = posY - 0.5;

      y = -1.0 * order.y * scaleFactor.y * (pow(2.0, zoom) * size * posY + (cameraOffset.y - globalMag * size * pow(2.0, globalLevel) * 0.5));

      // values when position.y = 0
      latBase = order.y * (PI / 2.0 - (offset.y * sizeRad));
    } else {
      y = scaleFactor.y * (tileOffset.y - cameraOffset.y);
    }

    ${sh(`uv = vec2(position.y, position.x) / size;`, ['texture'])}
    ${sh(vars.map(d => `${d}v = ${d};`).join(''), ['grid', 'dotgrid'])}
    ${sh(`gl_PointSize = 0.9 * scale * mag;`, ['grid', 'dotgrid'])}
    gl_Position = vec4(x, y, 0.0, 1.0);
  }`;
};

export const frag = (mode, vars, customFrag, customUniforms) => {
  const sh = _sh(mode);

  const declarations = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform float opacity;
  uniform sampler2D colormap;
  uniform vec2 clim;
  uniform float fillValue;
  uniform float projection;
  uniform float viewportHeight;
  uniform float pixelRatio;
  uniform float zoom;
  uniform float level;
  uniform float centerY;
  uniform vec2 order;
  varying float latBase;
  ${sh(`varying vec2 uv;`, ['texture'])}
  ${sh(vars.map(d => `uniform sampler2D ${d};`).join(''), ['texture'])}
  ${sh(vars.map(d => `varying float ${d}v;`).join(''), ['grid', 'dotgrid'])}
  ${customUniforms.map(d => `uniform float ${d};`).join('')}
  `;

  if (!customFrag)
    return `
    ${declarations}
    ${mercatorInvert}
    #define PI 3.1415926535897932384626433832795

    void main() {
      ${sh(
        `
      // By default (mercator projection), index into vars[0] using uv
      vec2 coord = uv;

      // Equirectangular
      if (projection == 1.0) {
        float scale = pixelRatio * 512.0;
        float mag = pow(2.0, zoom);
        float numTiles = pow(2.0, level);
        float sizeRad = PI / numTiles;

        // (1 => 0)
        float y = gl_FragCoord.y / viewportHeight;
        // (1 => 0)
        float delta = 1.0 - centerY;
        float mercatorY = viewportHeight * (y - 0.5) / (scale * mag) + delta;
        vec2 lookup = mercatorInvert((uv.y * 2.0 - 1.0) * PI, (mercatorY * 2.0 - 1.0) * PI);
        float rescaledX = lookup.x / 360.0 + 0.5;
        float rescaledY = order.y * (latBase - radians(lookup.y)) / sizeRad;

        coord = vec2(rescaledY, rescaledX);
      }

      float ${vars[0]} = texture2D(${vars[0]}, coord).x;
      `,
        ['texture']
      )}
      ${sh(`float ${vars[0]} = ${vars[0]}v;`, ['grid', 'dotgrid'])}
      ${sh(
        `
      if (length(gl_PointCoord.xy - 0.5) > 0.5) {
        discard;
      }
      `,
        ['dotgrid']
      )}
      if (${vars[0]} == fillValue) {
        discard;
      }
      float rescaled = (${vars[0]} - clim.x)/(clim.y - clim.x);
      vec4 c = texture2D(colormap, vec2(rescaled, 1.0));
      gl_FragColor = vec4(c.x, c.y, c.z, opacity);
      gl_FragColor.rgb *= gl_FragColor.a;
    }`;

  if (customFrag)
    return `
    ${declarations}
    void main() {
      ${sh(`${vars.map(d => `float ${d} = texture2D(${d}, uv).x;`).join('')}`, ['texture'])}
      ${sh(`${vars.map(d => `float ${d} = ${d}v;`).join('')}`, ['grid', 'dotgrid'])}
      ${customFrag}
    }`;
};

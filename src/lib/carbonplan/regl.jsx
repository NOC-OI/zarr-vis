'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import _regl from 'regl';
import { webgl2Compat } from './webgl2-compat';

export const ReglContext = createContext(null);

export const useRegl = () => useContext(ReglContext);

const Regl = ({ style, extensions = null, children }) => {
  const containerRef = useRef(null);
  const reglRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const requiredExtensions = [
      'OES_texture_float',
      'OES_element_index_uint',
      ...(extensions || [])
    ];

    const node = containerRef.current;
    if (!node || reglRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL is not supported.');

      const missing = requiredExtensions.filter(ext => !gl.getExtension(ext));
      canvas.remove();

      if (missing.length > 0) {
        console.warn(
          `Some required WebGL extensions are missing: ${missing.join(', ')}. Using webgl2Compat.`
        );
      }

      const instance =
        missing.length > 0
          ? webgl2Compat.overrideContextType(() =>
              _regl({ container: node, extensions: requiredExtensions })
            )
          : _regl({ container: node, extensions: requiredExtensions });

      reglRef.current = instance;

      if (isMounted) {
        setReady(true);
      }
    } catch (err) {
      console.error('Error initializing regl:', err);
    }

    return () => {
      isMounted = false;
      if (reglRef.current) {
        reglRef.current.destroy();
        reglRef.current = null;
      }
      setReady(false);
    };
  }, [extensions]);

  return (
    <ReglContext.Provider value={{ regl: reglRef.current }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', ...style }} />
      {ready && children}
    </ReglContext.Provider>
  );
};

export default Regl;

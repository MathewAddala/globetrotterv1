import React, { useRef, useEffect } from 'react';

// NOTE: All libraries are loaded from index.html, so no imports needed.

const Globe = ({ isSpinning, targetRotation, isVisible }) => {
  const mountRef = useRef(null);
  // Using a ref to hold three.js objects that don't need to trigger re-renders
  const threeRef = useRef({
    camera: null,
    controls: null,
    earthSphere: null,
  }).current;

  // Effect to set up the three.js scene once
  useEffect(() => {
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    threeRef.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const currentMount = mountRef.current;
    if (currentMount) currentMount.appendChild(renderer.domElement);
    
    threeRef.controls = new window.THREE.OrbitControls(threeRef.camera, renderer.domElement);
    threeRef.controls.enableDamping = true;
    threeRef.controls.minDistance = 7;
    threeRef.controls.maxDistance = 20;

    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/land_ocean_ice_cloud_2048.jpg');
    const material = new THREE.MeshBasicMaterial({ map: texture });
    threeRef.earthSphere = new THREE.Mesh(geometry, material);
    scene.add(threeRef.earthSphere);
    threeRef.camera.position.z = 10;

    const animate = () => {
      requestAnimationFrame(animate);
      if (threeRef.isSpinning && threeRef.targetRotation && threeRef.earthSphere && threeRef.earthSphere.quaternion) {
        // ensure targetRotation is a valid quaternion-like object
        try {
          if (typeof threeRef.targetRotation.slerp === 'function') {
            // unlikely scenario, but skip if targetRotation is unexpected
          }
        } catch { /* ignore */ }
        threeRef.earthSphere.quaternion.slerp(threeRef.targetRotation, 0.1);
      }
      threeRef.controls.update();
      renderer.render(scene, threeRef.camera);
    };
    animate();
    
    return () => { if (currentMount) { currentMount.removeChild(renderer.domElement); } };
  }, [threeRef]);

  // Effect to handle animations based on props from App.jsx
  useEffect(() => {
    threeRef.isSpinning = isSpinning;
    if (targetRotation) {
      threeRef.targetRotation = targetRotation;
    }
    
    if (isSpinning) {
        threeRef.controls.enabled = false;
        // This is the zoom ("enlarging") effect
        window.anime({ targets: threeRef.camera.position, z: 7, duration: 2000, easing: 'easeInOutQuad' });
    } else {
        threeRef.controls.enabled = true;
        // This resets the zoom
        window.anime({ targets: threeRef.camera.position, z: 10, duration: 500, easing: 'easeOutQuad' });
    }
  }, [isSpinning, targetRotation, threeRef]);

  return <div className="globe-container" style={{ opacity: isVisible ? 1 : 0 }} ref={mountRef} />;
};

export default Globe;
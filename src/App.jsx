import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GESTURES = {
  CHAOS: 'CHAOS',               
  FIST: 'FIST',                 
  FIVE_FINGERS: 'FIVE_FINGERS',         
  INDEX_SINGLE: 'INDEX_SINGLE',         
  TWO_FINGERS_SCRATCH: 'TWO_FINGERS_SCRATCH' 
};

// 🌟 動態生成一張「電影級星雲煙霧」的紋理基底
function createNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.15, 'rgba(220, 190, 130, 0.7)'); 
  gradient.addColorStop(0.4, 'rgba(40, 30, 70, 0.25)');    
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');            
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// 🌊 全螢幕透明水波紋著色器組件
function TransparentWaterRipple({ active }) {
  const materialRef = useRef();

  const WaterShader = React.useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 cPos = vUv - vec2(0.5);
        float len = length(cPos);
        
        float ripple = sin(len * 45.0 - uTime * 3.5) * 0.04;
        ripple += sin(len * 25.0 - uTime * 2.0) * 0.02;
        ripple += sin((cPos.x + cPos.y) * 15.0 + uTime) * 0.01;
        
        float alpha = smoothstep(0.6, 0.1, len) * uOpacity;
        vec3 rippleColor = mix(vec3(0.77, 0.63, 0.35), vec3(0.2, 0.4, 0.6), sin(uTime * 0.4) * 0.5 + 0.5);
        
        float highlight = max(0.0, ripple * 3.5);
        vec3 finalColor = rippleColor + vec3(highlight * 0.3);
        
        gl_FragColor = vec4(finalColor, alpha * (0.25 + highlight * 0.6));
      }
    `
  }), []);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    
    const targetOpacity = active ? 1.0 : 0.0;
    materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uOpacity.value, targetOpacity, 0.06
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial 
        ref={materialRef}
        args={[WaterShader]} 
        transparent={true} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// 🌌 量子流體星雲系統
function CosmicFluidBackground({ globalGesture, pointerX, hideNebula }) {
  const smokeRef = useRef(); const dustRef = useRef();
  const smokeCount = 2000; const dustCount = 2500;  
  const nebulaTexture = React.useMemo(() => createNebulaTexture(), []);
  const currentOpacity = useRef(0.38);

  const colorsConfig = React.useMemo(() => ({
    coreGold: new THREE.Color('#ffd785'), nebulaBlue: new THREE.Color('#416385')   
  }), []);

  const [smokePositions, smokeVelocities, smokeExtras, smokeColors] = React.useMemo(() => {
    const pos = new Float32Array(smokeCount * 3); const vel = new Float32Array(smokeCount * 3);
    const extra = new Float32Array(smokeCount * 3); const cols = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      const radius = 0.2 + Math.random() * 4.5; const angle = Math.random() * Math.PI * 2; const height = (Math.random() - 0.5) * 5;
      pos[i * 3] = Math.cos(angle) * radius; pos[i * 3 + 1] = height; pos[i * 3 + 2] = Math.sin(angle) * radius - 0.8;
      extra[i * 3] = radius; extra[i * 3 + 1] = angle; extra[i * 3 + 2] = 0.005 + Math.random() * 0.01;
      const mixedColor = colorsConfig.coreGold.clone().lerp(colorsConfig.nebulaBlue, radius / 4.5);
      cols[i * 3] = mixedColor.r; cols[i * 3 + 1] = mixedColor.g; cols[i * 3 + 2] = mixedColor.b;
    }
    return [pos, vel, extra, cols];
  }, [colorsConfig]);

  const [dustPositions, dustVelocities, dustExtras, dustColors] = React.useMemo(() => {
    const pos = new Float32Array(dustCount * 3); const vel = new Float32Array(dustCount * 3);
    const extra = new Float32Array(dustCount * 3); const cols = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const radius = 0.1 + Math.random() * 5.0; const angle = Math.random() * Math.PI * 2; const height = (Math.random() - 0.5) * 6;
      pos[i * 3] = Math.cos(angle) * radius; pos[i * 3 + 1] = height; pos[i * 3 + 2] = Math.sin(angle) * radius - 0.8;
      extra[i * 3] = radius; extra[i * 3 + 1] = angle; extra[i * 3 + 2] = 0.4 + Math.random() * 0.8;
      const rand = Math.random(); const mixedColor = rand > 0.6 ? colorsConfig.coreGold : new THREE.Color('#ffffff').lerp(colorsConfig.nebulaBlue, rand);
      cols[i * 3] = mixedColor.r; cols[i * 3 + 1] = mixedColor.g; cols[i * 3 + 2] = mixedColor.b;
    }
    return [pos, vel, extra, cols];
  }, [colorsConfig]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const targetX = globalGesture === GESTURES.FIVE_FINGERS ? pointerX * 2.5 : 0;
    const targetY = globalGesture === GESTURES.FIST ? -1.3 : 0.2; 

    const targetOpacity = hideNebula ? 0.0 : 0.38;
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, 0.06);
    if (smokeRef.current) smokeRef.current.material.opacity = currentOpacity.current;
    if (dustRef.current) dustRef.current.material.opacity = currentOpacity.current * 2.2;

    if (smokeRef.current) {
      const posAttr = smokeRef.current.geometry.attributes.position; const arr = posAttr.array;
      for (let i = 0; i < smokeCount; i++) {
        const idx = i * 3; smokeExtras[idx + 1] += (0.015 / (smokeExtras[idx] + 0.3)) + 0.002;
        const wave = Math.sin(arr[idx + 1] * 1.5 + time * 0.4) * 0.15; const targetRadius = smokeExtras[idx] + wave;
        let tx = Math.cos(smokeExtras[idx + 1]) * targetRadius; let tz = Math.sin(smokeExtras[idx + 1]) * targetRadius - 0.8; let ty = arr[idx + 1] + smokeExtras[idx + 2]; 
        if (globalGesture === GESTURES.FIST) {
          tx = THREE.MathUtils.lerp(arr[idx], targetX, 0.08); ty = THREE.MathUtils.lerp(arr[idx + 1], targetY, 0.08); tz = THREE.MathUtils.lerp(arr[idx + 2], -0.8, 0.08);
        } else if (globalGesture === GESTURES.CHAOS) {
          tx += Math.sin(ty * 1.5 + time) * 0.01; tz += Math.cos(tx * 1.5 + time) * 0.01;
        }
        arr[idx] = THREE.MathUtils.lerp(arr[idx], tx, 0.05); arr[idx + 1] = ty; arr[idx + 2] = THREE.MathUtils.lerp(arr[idx + 2], tz, 0.05);
        if (arr[idx + 1] > 4.0) { arr[idx + 1] = -4.0; smokeExtras[idx + 1] = Math.random() * Math.PI * 2; }
      }
      posAttr.needsUpdate = true;
    }

    if (dustRef.current) {
      const posAttr = dustRef.current.geometry.attributes.position; const arr = posAttr.array;
      for (let i = 0; i < dustCount; i++) {
        const idx = i * 3; dustExtras[idx + 1] += (0.025 / (dustExtras[idx] + 0.2)) + 0.003;
        let tx = Math.cos(dustExtras[idx + 1]) * (dustExtras[idx] + Math.cos(time * 0.5 + i) * 0.08); let tz = Math.sin(dustExtras[idx + 1]) * (dustExtras[idx] + Math.cos(time * 0.5 + i) * 0.08) - 0.8; let ty = arr[idx + 1] + 0.012; 
        if (globalGesture === GESTURES.FIVE_FINGERS) { tx += targetX * 0.2; } 
        else if (globalGesture === GESTURES.FIST) {
          tx = THREE.MathUtils.lerp(arr[idx], targetX, 0.1); ty = THREE.MathUtils.lerp(arr[idx + 1], targetY, 0.1); tz = THREE.MathUtils.lerp(arr[idx + 2], -0.8, 0.1);
        }
        arr[idx] = THREE.MathUtils.lerp(arr[idx], tx, 0.06); arr[idx + 1] = ty; arr[idx + 2] = THREE.MathUtils.lerp(arr[idx + 2], tz, 0.06);
        if (arr[idx + 1] > 4.0) arr[idx + 1] = -4.0;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group> 
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smokePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[smokeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.25} map={nebulaTexture} vertexColors={true} transparent={true} opacity={0.38} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dustColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} map={nebulaTexture} vertexColors={true} transparent={true} opacity={0.85} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// 🃏 3D 無限卡牌核心組件
function TarotDeck({ 
  globalGestureRef, pointerRef, currentTextureUrl, onForceGestureChange, 
  onCardRevealedChange, isScratchFinished, activeCardIndex 
}) {
  const meshRef = useRef();
  const cardCount = 80; 

  const scrollOffset = useRef(0);      
  const targetScrollOffset = useRef(0); 
  const lastPointerX = useRef(0);

  const mainCanvasRef = useRef(null);      
  const maskCanvasRef = useRef(null);      
  const scratchTextureRef = useRef(null);
  const frontImageElementRef = useRef(null); 
  const [initComplete, setInitComplete] = useState(false);
  const lastUrlRef = useRef('');

  const isScratchRevealedRef = useRef(false);
  const isLockedInCenterRef = useRef(false); 
  const frameCounterRef = useRef(0); 

  useEffect(() => {
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 512; mainCanvas.height = 512;
    mainCanvasRef.current = mainCanvas;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 512; maskCanvas.height = 512;
    maskCanvasRef.current = maskCanvas;

    const scratchTex = new THREE.CanvasTexture(mainCanvas);
    scratchTex.colorSpace = THREE.SRGBColorSpace;
    scratchTextureRef.current = scratchTex;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/tarot-front.jpg', (backTex) => {
      backTex.colorSpace = THREE.SRGBColorSpace;
      if (meshRef.current && meshRef.current.material && meshRef.current.material[5]) {
        meshRef.current.material[5].map = backTex;
        meshRef.current.material[5].needsUpdate = true;
      }
    }, undefined, () => {
       console.log("正在使用 tarot-front.jpg 作為牌背");
    });
    loadTargetFrontImage(null);
  }, []);

  useEffect(() => {
    if (currentTextureUrl && currentTextureUrl !== lastUrlRef.current) {
      lastUrlRef.current = currentTextureUrl;
      loadTargetFrontImage(currentTextureUrl);
    }
  }, [currentTextureUrl]);

  const loadTargetFrontImage = (imgUrl) => {
    const targetUrl = imgUrl || '/cards/01.png';
    const img = new Image();
    img.src = targetUrl;
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      frontImageElementRef.current = img;
      isScratchRevealedRef.current = false;
      isLockedInCenterRef.current = false; 
      onCardRevealedChange(false); 
      resetMaskLayer('#150f21', '#c5a059', true); 
      composeFinalTexture();
      setInitComplete(true);
    };
    img.onerror = () => {
      console.log("圖片未找到，使用苗繡底色佔位");
      frontImageElementRef.current = null;
      isScratchRevealedRef.current = false;
      isLockedInCenterRef.current = false;
      onCardRevealedChange(false);
      resetMaskLayer('#2a1a08', '#c5a059', true);
      composeFinalTexture();
      setInitComplete(true);
    }
  };

  const resetMaskLayer = (bgColor, strokeColor, showQuestionMark) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const mCtx = maskCanvas.getContext('2d');
    mCtx.globalCompositeOperation = 'source-over';
    mCtx.fillStyle = bgColor; mCtx.fillRect(0, 0, 512, 512);
    mCtx.strokeStyle = strokeColor; mCtx.lineWidth = 16; mCtx.strokeRect(25, 25, 462, 462);
    if (showQuestionMark) {
      mCtx.fillStyle = strokeColor; mCtx.font = 'bold 280px serif'; mCtx.textAlign = 'center'; mCtx.textBaseline = 'middle';
      mCtx.fillText('?', 256, 265);
    }
  };

  const composeFinalTexture = () => {
    const mainCanvas = mainCanvasRef.current; const maskCanvas = maskCanvasRef.current;
    if (!mainCanvas || !maskCanvas) return;
    const ctx = mainCanvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, 512, 512);
    if (frontImageElementRef.current) {
      ctx.drawImage(frontImageElementRef.current, 0, 0, 512, 512);
    } else { 
      ctx.fillStyle = '#1e1203'; ctx.fillRect(0, 0, 512, 512); 
      ctx.fillStyle = '#c5a059'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText("苗繡非遺卡牌", 256, 230);
    }
    ctx.drawImage(maskCanvas, 0, 0, 512, 512);
    if (scratchTextureRef.current) scratchTextureRef.current.needsUpdate = true;
  };

  const checkScratchPercentage = () => {
    const maskCanvas = maskCanvasRef.current; if (!maskCanvas) return false;
    const mCtx = maskCanvas.getContext('2d');
    const imgData = mCtx.getImageData(0, 0, 512, 512); const pixels = imgData.data;
    let transparentPixels = 0; const step = 32; let sampleCount = 0;
    for (let i = 0; i < pixels.length; i += step * 4) {
      sampleCount++; if (pixels[i + 3] < 10) transparentPixels++;
    }
    return (transparentPixels / sampleCount) >= 0.70;
  };

  const chaosSeeds = useRef(Array.from({ length: cardCount }, () => ({
    seedX: Math.random() * 100, seedY: Math.random() * 100, seedZ: Math.random() * 100,
    rotSpeedX: (Math.random() - 0.5) * 2.5, rotSpeedY: (Math.random() - 0.5) * 2.5, rotSpeedZ: (Math.random() - 0.5) * 2.5,
  })));

  const cards = useRef(Array.from({ length: cardCount }, () => ({
    pos: new THREE.Vector3((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3), 
    rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    targetPos: new THREE.Vector3(0, 0, 0), targetRot: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1), targetScale: new THREE.Vector3(1, 1, 1)
  })));

  const lastIsLightGoldRef = useRef(false);

  useFrame((state) => {
    if (!meshRef.current || !mainCanvasRef.current || !initComplete) return;
    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    
    let currentGesture = globalGestureRef.current;
    const currentPointerX = pointerRef.current; 
    const data = cards.current;

    if (isLockedInCenterRef.current && !isScratchFinished) {
      currentGesture = GESTURES.TWO_FINGERS_SCRATCH; 
    }

    if (currentGesture === GESTURES.FIVE_FINGERS && !isScratchRevealedRef.current) {
      const deltaX = currentPointerX - lastPointerX.current;
      targetScrollOffset.current += deltaX * 3.5; 
    }
    lastPointerX.current = currentPointerX;
    
    scrollOffset.current = THREE.MathUtils.lerp(scrollOffset.current, targetScrollOffset.current, 0.08);
    let activeIndex = activeCardIndex;

    const isPickedState = (currentGesture === GESTURES.INDEX_SINGLE || currentGesture === GESTURES.TWO_FINGERS_SCRATCH);
    if (isPickedState && !lastIsLightGoldRef.current) {
      if (!isScratchRevealedRef.current) resetMaskLayer('#f3e5ab', '#d4ac0d', false); 
      composeFinalTexture(); lastIsLightGoldRef.current = true;
    } else if (!isPickedState && lastIsLightGoldRef.current) {
      if (!isScratchRevealedRef.current) resetMaskLayer('#150f21', '#c5a059', true);  
      composeFinalTexture(); lastIsLightGoldRef.current = false;
    }

    if (currentGesture === GESTURES.TWO_FINGERS_SCRATCH && !isScratchRevealedRef.current) {
      const maskCanvas = maskCanvasRef.current; const mCtx = maskCanvas.getContext('2d');
      const brushX = (currentPointerX + 1) * 256; const brushY = 256 + Math.sin(time * 7) * 140; 
      mCtx.globalCompositeOperation = 'destination-out'; mCtx.beginPath(); mCtx.arc(brushX, brushY, 90, 0, Math.PI * 2); mCtx.fill();
      composeFinalTexture();

      frameCounterRef.current++;
      if (frameCounterRef.current % 15 === 0) {
        if (checkScratchPercentage()) {
          isScratchRevealedRef.current = true;
          isLockedInCenterRef.current = true; 
          onCardRevealedChange(true); 
          mCtx.globalCompositeOperation = 'destination-out'; mCtx.fillRect(0, 0, 512, 512); composeFinalTexture();
        }
      }
    }

    data.forEach((c, i) => {
      const seed = chaosSeeds.current[i];

      if (isScratchFinished) {
        if (i === activeIndex) {
          c.targetPos.set(0, 0.7, 0.3);       
          c.targetRot.set(0, 0, 0); c.targetScale.set(0.9, 0.9, 0.9);    
        } else {
          c.targetPos.set((i < activeIndex ? -4 : 4), -2, -1);
          c.targetRot.set(0, 0, 0); c.targetScale.set(0.1, 0.1, 0.1);
        }
      }
      else if (currentGesture === GESTURES.CHAOS) {
        const flyX = Math.sin(time * 0.25 + seed.seedX) * 3.5;
        const flyY = Math.cos(time * 0.2 + seed.seedY) * 2.2;
        const flyZ = Math.sin(time * 0.4 + seed.seedZ) * 1.2 - 0.4;
        c.targetPos.set(flyX, flyY, flyZ);
        c.targetRot.set(time * seed.rotSpeedX, time * seed.rotSpeedY, time * seed.rotSpeedZ);
        c.targetScale.set(1, 1, 1);
      }
      else if (currentGesture === GESTURES.FIST) {
        // ⚡【核心修改】：让 80 张牌完全聚拢成一叠
        // X 轴完全对齐零点，Z 轴采用极细微阶梯间距（0.001）防止在 GPU 中产生画面闪烁混叠（Z-Fighting）
        c.targetPos.set(0, -1.1, -i * 0.001); 
        // 统一牌面角度（完全平齐，正面面朝后方以契合原版构图，不产生任何扇形旋转）
        c.targetRot.set(0, Math.PI, 0); 
        c.targetScale.set(1, 1, 1);
        targetScrollOffset.current = 0; 
      }
      else if (currentGesture === GESTURES.FIVE_FINGERS) {
        const cardSpacing = 0.25; const totalWidth = cardCount * cardSpacing;
        let currentX = (i * cardSpacing) + (scrollOffset.current * 1.3);
        const halfWidth = totalWidth / 2; currentX = ((currentX + halfWidth) % totalWidth);
        if (currentX < 0) currentX += totalWidth; currentX -= halfWidth; 

        if (i === activeIndex) {
          c.targetPos.set(currentX, 0.25, 0.6);
          c.targetRot.set(Math.sin(time * 2) * 0.05, 0, 0); c.targetScale.set(1.25, 1.25, 1.25);
        } else {
          let dist = Math.abs(i - activeIndex); if (dist > cardCount / 2) dist = cardCount - dist; 
          c.targetPos.set(currentX, -0.05 - dist * 0.004, -dist * 0.008);
          c.targetRot.set(0, (currentX * -0.1), 0); c.targetScale.set(0.85, 0.85, 0.85);
        }
      } 
      else if (currentGesture === GESTURES.INDEX_SINGLE || currentGesture === GESTURES.TWO_FINGERS_SCRATCH) {
        if (i === activeIndex) {
          c.targetPos.set(0, 0.05, 0.85);       
          c.targetRot.set(0, 0, 0); c.targetScale.set(1.4, 1.4, 1.4);    
        } else {
          const isLeft = i < activeIndex;
          const escapeX = isLeft ? -2.8 - (i * 0.005) : 2.8 + ((i - activeIndex) * 0.005);
          c.targetPos.set(escapeX, -1.8, -0.6); c.targetRot.set(0, 0, 0); c.targetScale.set(0.5, 0.5, 0.5);
        }
      }

      const lerpSpeed = currentGesture === GESTURES.FIST ? 0.18 : 0.08; 
      c.pos.lerp(c.targetPos, lerpSpeed);
      c.rot.x = THREE.MathUtils.lerp(c.rot.x, c.targetRot.x, lerpSpeed);
      c.rot.y = THREE.MathUtils.lerp(c.rot.y, c.targetRot.y, lerpSpeed);
      c.rot.z = THREE.MathUtils.lerp(c.rot.z, c.targetRot.z, lerpSpeed);
      c.scale.lerp(c.targetScale, lerpSpeed);

      dummy.position.copy(c.pos); dummy.rotation.copy(c.rot); dummy.scale.copy(c.scale); dummy.updateMatrix();
      if (meshRef.current) meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, cardCount]}>
      <boxGeometry args={[0.42, 0.72, 0.015]} />
      <meshStandardMaterial color="#05020a" roughness={0.12} metalness={0.92} emissive="#cfb076" emissiveIntensity={0.18} />
      <meshStandardMaterial color="#05020a" roughness={0.12} metalness={0.92} emissive="#cfb076" emissiveIntensity={0.18} />
      <meshStandardMaterial color="#05020a" roughness={0.12} metalness={0.92} emissive="#cfb076" emissiveIntensity={0.18} />
      <meshStandardMaterial color="#05020a" roughness={0.12} metalness={0.92} emissive="#cfb076" emissiveIntensity={0.18} />
      {initComplete ? (
        <>
          <meshStandardMaterial roughness={0.3} metalness={0.1} /> 
          <meshStandardMaterial map={scratchTextureRef.current} transparent={true} depthWrite={true} roughness={0.4} />
        </>
      ) : (
        <meshStandardMaterial color="#150f21" roughness={0.5} />
      )}
      <meshStandardMaterial color="#05020a" roughness={0.12} metalness={0.92} emissive="#cfb076" emissiveIntensity={0.18} />
    </instancedMesh>
  );
}

export default function TarotExperience() {
  const videoRef = useRef(null); const canvasRef = useRef(null); const cameraInstanceRef = useRef(null);
  const [gestureState, setGestureState] = useState(GESTURES.CHAOS); const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  
  const [isStarted, setIsStarted] = useState(false);
  const [isCoverFading, setIsCoverFading] = useState(false);

  const [uploadedImages, setUploadedImages] = useState([]); 
  const uploadedImagesRef = useRef([]);
  const [currentTextureUrl, setCurrentTextureUrl] = useState(null);

  const [isCardRevealed, setIsCardRevealed] = useState(false);     
  const [isScratchFinished, setIsScratchFinished] = useState(false); 
  const [chosenIndex, setChosenIndex] = useState(0);               
  const [activeCardIndex, setActiveCardIndex] = useState(5); 

  const [isDissolving, setIsDissolving] = useState(false); 

  const globalGestureRef = useRef(GESTURES.CHAOS); const pointerRef = useRef(0);
  
  const gestureHistory = useRef([]); 
  const hasEverFisted = useRef(false); 
  const lastGestureRef = useRef(GESTURES.CHAOS); const scratchLockExpiryRef = useRef(0); 
  const lastSentTimeRef = useRef(0); 

  const lastFingerYRef = useRef(0); 

  const changeState = (nextG) => {
    if (globalGestureRef.current !== nextG) { globalGestureRef.current = nextG; setGestureState(nextG); }
  };

  const handleMouseMove = (e) => { pointerRef.current = (e.clientX / window.innerWidth) * 2 - 1; };

  const triggerManualInteract = () => {
    if (isCardRevealed && !isScratchFinished) {
      setIsScratchFinished(true);
    }
  };

  const handleStartExperience = () => {
    setIsCoverFading(true);
    setTimeout(() => {
      setIsStarted(true);
      changeState(GESTURES.CHAOS); 
    }, 800); 
  };

  useEffect(() => {
    console.log("🔮 正在從本地 public/cards 文件夾中構建卡牌數組...");
    const localPool = [];
    for (let i = 1; i <= 12; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      localPool.push(`/cards/${numStr}.png`);
    }
    for (let i = 1; i <= 24; i++) {
      if(i >= 13) localPool.push(`/cards/${i}.png`);
    }
    setUploadedImages(localPool);
    uploadedImagesRef.current = localPool;
    
    const randIndex = Math.floor(Math.random() * 80);
    setChosenIndex(randIndex % 12); 

    const initNumStr = ((randIndex % 12) + 1) < 10 ? `0${(randIndex % 12) + 1}` : `${(randIndex % 12) + 1}`;
    setCurrentTextureUrl(`/cards/${initNumStr}.png`);
    setActiveCardIndex(randIndex); 
  }, []);

  useEffect(() => {
    if (isScratchFinished) {
      setIsDissolving(false); 
      const dissolveTimer = setTimeout(() => { setIsDissolving(true); }, 5000);
      const resetTimer = setTimeout(() => {
        setIsCardRevealed(false);
        setIsScratchFinished(false);
        setIsDissolving(false);
        changeState(GESTURES.CHAOS);
        
        const pool = uploadedImagesRef.current;
        if(pool.length > 0){
          const randIndex = Math.floor(Math.random() * 80);
          setChosenIndex(randIndex % 12);
          const finalNumStr = ((randIndex % 12) + 1) < 10 ? `0${(randIndex % 12) + 1}` : `${(randIndex % 12) + 1}`;
          setCurrentTextureUrl(`/cards/${finalNumStr}.png`);
          setActiveCardIndex(randIndex);
        }
      }, 7000); 

      return () => { clearTimeout(dissolveTimer); clearTimeout(resetTimer); };
    }
  }, [isScratchFinished]);

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement('script'); script.src = src; script.async = true; script.onload = resolve;
        document.head.appendChild(script);
      });
    };
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
      loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
    ]).then(() => { setIsSdkLoaded(true); });
  }, []);

  useEffect(() => {
    if (!isSdkLoaded || !isStarted) return; 
    const WinHands = window.Hands; const WinCamera = window.Camera;
    if (!WinHands || !WinCamera) return;

    const hands = new WinHands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45 });

    hands.onResults((results) => {
      if (!canvasRef.current || !videoRef.current || !results || videoRef.current.videoWidth === 0) return;
      const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const currentTime = performance.now();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const isFingerExtended = (tipIdx, mcpIdx) => landmarks[tipIdx].y < landmarks[mcpIdx].y - 0.02;

        const indexExtended  = isFingerExtended(8, 5);   
        const middleExtended = isFingerExtended(12, 9);  
        const ringExtended   = isFingerExtended(16, 13); 
        const pinkyExtended  = isFingerExtended(20, 17); 
        const isFistState = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

        const currentFingerY = landmarks[8].y; 
        const deltaFingerY = currentFingerY - lastFingerYRef.current; 
        lastFingerYRef.current = currentFingerY;

        pointerRef.current = pointerRef.current * 0.6 + (-(landmarks[8].x - 0.5) * 2) * 0.4; 

        let rawDetected = GESTURES.CHAOS; 
        if (indexExtended && middleExtended && ringExtended && pinkyExtended) { rawDetected = GESTURES.FIVE_FINGERS; } 
        else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) { rawDetected = GESTURES.TWO_FINGERS_SCRATCH; } 
        else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) { rawDetected = GESTURES.INDEX_SINGLE; } 
        else if (isFistState) { rawDetected = GESTURES.FIST; }

        if (rawDetected === GESTURES.TWO_FINGERS_SCRATCH) scratchLockExpiryRef.current = currentTime + 500; 
        if (currentTime < scratchLockExpiryRef.current && globalGestureRef.current === GESTURES.TWO_FINGERS_SCRATCH) rawDetected = GESTURES.TWO_FINGERS_SCRATCH;

        gestureHistory.current.push(rawDetected); if (gestureHistory.current.length > 12) gestureHistory.current.shift();

        const counts = gestureHistory.current.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
        const mostFrequentGesture = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        
        if (isCardRevealed && !isScratchFinished) {
          const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;
          if (extendedCount >= 2 && deltaFingerY > 0.015) { setIsScratchFinished(true); }
        }

        if (counts[mostFrequentGesture] >= 3) {
          if (mostFrequentGesture === GESTURES.FIVE_FINGERS && isScratchFinished) {
            const currentHandX = landmarks[0].x;
            if (currentHandX > 0.6) { setIsCardRevealed(false); setIsScratchFinished(false); changeState(GESTURES.CHAOS); }
          }
          if (!hasEverFisted.current && mostFrequentGesture !== GESTURES.FIST) changeState(GESTURES.CHAOS); 
          else { if (mostFrequentGesture === GESTURES.FIST) hasEverFisted.current = true; changeState(mostFrequentGesture); }
        }

        if (globalGestureRef.current === GESTURES.INDEX_SINGLE && lastGestureRef.current !== GESTURES.INDEX_SINGLE && !isCardRevealed) {
          const pool = uploadedImagesRef.current;
          if (pool && pool.length > 0) {
            const randIndex = Math.floor(Math.random() * 80);
            setChosenIndex(randIndex % 12);
            const finalNumStr = ((randIndex % 12) + 1) < 10 ? `0${(randIndex % 12) + 1}` : `${(randIndex % 12) + 1}`;
            setCurrentTextureUrl(`/cards/${finalNumStr}.png`); 
            setActiveCardIndex(randIndex);
          }
        }
        lastGestureRef.current = globalGestureRef.current;

        results.multiHandLandmarks.forEach((handPoints) => {
          ctx.fillStyle = '#c5a059';
          handPoints.forEach((pt) => { ctx.beginPath(); ctx.arc(pt.x * canvasRef.current.width, pt.y * canvasRef.current.height, 4, 0, 2 * Math.PI); ctx.fill(); });
        });
      } else {
        if (isCardRevealed && !isScratchFinished) { setIsScratchFinished(true); }
        if (currentTime > scratchLockExpiryRef.current && globalGestureRef.current !== GESTURES.TWO_FINGERS_SCRATCH) { changeState(hasEverFisted.current ? GESTURES.FIST : GESTURES.CHAOS); }
        lastGestureRef.current = globalGestureRef.current;
      }
    });

    if (videoRef.current) {
      cameraInstanceRef.current = new WinCamera(videoRef.current, {
        onFrame: async () => {
          const now = performance.now();
          if (now - lastSentTimeRef.current > 35) { 
            lastSentTimeRef.current = now;
            if (videoRef.current && videoRef.current.readyState >= 2) { 
              try { await hands.send({ image: videoRef.current }); } catch (e) {} 
            }
          }
        }, width: 320, height: 240,
      });
      cameraInstanceRef.current.start().catch(() => {});
    }
    return () => { if (cameraInstanceRef.current) { try { cameraInstanceRef.current.stop(); } catch(e){} } };
  }, [isSdkLoaded, isCardRevealed, isScratchFinished, isStarted]);

  const btnStyle = (active) => ({
    padding: '10px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid #c5a059', cursor: 'pointer',
    background: active ? '#c5a059' : 'rgba(10, 5, 20, 0.8)', color: active ? '#000' : '#c5a059', fontWeight: 'bold'
  });

  return (
    <div onMouseMove={handleMouseMove} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', backgroundColor: '#020104', overflow: 'hidden', zIndex: 99999 }}>
      
      <style>{`
        @keyframes revealScroll {
          0% { transform: scale(0.4) rotateX(-35deg) translateY(50px); opacity: 0; filter: blur(15px); box-shadow: 0 0px 0px rgba(197, 160, 89, 0); }
          70% { filter: blur(2px); }
          100% { transform: scale(1) rotateX(0deg) translateY(0); opacity: 1; filter: blur(0px); box-shadow: 0 0 60px rgba(197, 160, 89, 0.45); }
        }
        @keyframes particleDissolve {
          0% { opacity: 1; filter: blur(0px) brightness(1); transform: scale(1) translateY(0px); mask-image: linear-gradient(to bottom, white 100%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, white 100%, transparent 100%); }
          30% { filter: blur(2px) brightness(1.3) contrast(1.2); }
          100% { opacity: 0; filter: blur(12px) brightness(2) mix-blend-mode(plus-lighter); transform: scale(0.92) translateY(-40px); mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 30%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 30%, transparent 100%); }
        }
        .fortune-window-enter { animation: revealScroll 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: center bottom; }
        .fortune-window-dissolve { animation: particleDissolve 2.0s cubic-bezier(0.4, 0, 1, 1) forwards !important; transform-origin: center top; }
        
        .cover-fade-out {
          opacity: 0 !important;
          filter: blur(25px);
          transform: scale(1.05);
          transition: all 0.9s cubic-bezier(0.25, 1, 0.5, 1);
          pointer-events: none;
        }
      `}</style>

      {/* 🔮 3D 渲染背景 */}
      <div style={{ position: 'absolute', width: '100vw', height: '100vh', left: 0, top: 0, zIndex: 10 }}>
        <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[0, 3, 3]} intensity={2.5} color="#c5a059" />
          
          <CosmicFluidBackground globalGesture={gestureState} pointerX={pointerRef.current} hideNebula={isScratchFinished} />
          <TransparentWaterRipple active={isScratchFinished} />

          <TarotDeck 
            globalGestureRef={globalGestureRef} 
            pointerRef={pointerRef} 
            currentTextureUrl={currentTextureUrl} 
            onForceGestureChange={changeState}
            onCardRevealedChange={(isDone) => setIsCardRevealed(isDone)} 
            isScratchFinished={isScratchFinished}
            activeCardIndex={activeCardIndex} 
          />
        </Canvas>
      </div>

      {/* 🌟 全屏初始仪式感封面系统 */}
      {!isStarted && (
        <div 
          className={isCoverFading ? 'cover-fade-out' : ''}
          style={{
            position: 'absolute', inset: 0, zIndex: 99990,
            background: 'linear-gradient(to bottom, rgba(5,2,15,0.2) 0%, rgba(2,1,4,0.7) 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            textAlign: 'center', transition: 'all 0.9s ease', backdropFilter: 'blur(1px)'
          }}
        >
          <h1 style={{
            color: '#ffffff', fontSize: '42px', fontWeight: '300', letterSpacing: '8px',
            textShadow: '0 0 25px rgba(255,255,255,0.4), 0 2px 12px rgba(0,0,0,0.9)', margin: '0 0 24px 0'
          }}>
            千絲萬縷 · 苗繡非遺卡牌
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.85)', fontSize: '15px', letterSpacing: '4px',
            margin: '0 0 16px 0', textShadow: '0 1px 5px rgba(0,0,0,0.8)', fontWeight: '300'
          }}>
            梭穿時空之經緯，絲連命運之圖騰
          </p>
          <p style={{
            color: 'rgba(197,160,89,0.85)', fontSize: '13px', letterSpacing: '2px',
            margin: '0 0 45px 0', textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontWeight: '300'
          }}>
            點擊開啟非遺卡牌，凝結屬於你的今日好運與傳承啟示
          </p>

          <button 
            onClick={handleStartExperience}
            style={{
              background: 'rgba(197, 160, 89, 0.08)', color: '#ffd785',
              border: '1px solid rgba(197, 160, 89, 0.6)', padding: '12px 38px',
              fontSize: '14px', borderRadius: '30px', cursor: 'pointer', letterSpacing: '3px',
              fontWeight: 'bold', boxShadow: '0 0 20px rgba(197, 160, 89, 0.2)',
              transition: 'all 0.3s ease', outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(197, 160, 89, 0.25)';
              e.target.style.boxShadow = '0 0 35px rgba(197, 160, 89, 0.5)';
              e.target.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(197, 160, 89, 0.08)';
              e.target.style.boxShadow = '0 0 20px rgba(197, 160, 89, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✨ 開啟今日好運 ✨
          </button>
        </div>
      )}

      {/* 提示条 */}
      {isStarted && isCardRevealed && !isScratchFinished && (
        <div onClick={triggerManualInteract} style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 9990,
          background: 'linear-gradient(90deg, rgba(197,160,89,0) 0%, rgba(197,160,89,0.85) 50%, rgba(197,160,89,0) 100%)',
          color: '#fff', padding: '14px 50px', fontWeight: 'bold', fontSize: '15px', letterSpacing: '2px',
          textShadow: '0 2px 4px #000', cursor: 'pointer', textAlign: 'center', borderRadius: '4px'
        }}>
          ✨ 卡牌已完全顯現！請直接保持雙指「✌️ 向下快速一揮」即可解鎖簽文（或直接點擊此條） ✨
        </div>
      )}

      {/* 签文弹窗 */}
      {isStarted && isScratchFinished && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(5, 2, 12, 0.45)', zIndex: 9995, backdropFilter: 'blur(4px)',
          transition: 'all 0.8s ease', perspective: '1200px'
        }}>
          <div 
            className={`fortune-window-enter ${isDissolving ? 'fortune-window-dissolve' : ''}`}
            style={{
              width: '360px', height: '580px', borderRadius: '16px', border: '2px solid rgba(197, 160, 89, 0.8)',
              overflow: 'hidden', backgroundColor: 'rgba(17, 10, 31, 0.95)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', backdropFilter: 'blur(10px)',
              position: 'relative', margin: '0 auto'
            }}
          >
            {isDissolving && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(197,160,89,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />}
            <div style={{ color: '#c5a059', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '2px', textShadow: '0 0 8px rgba(197,160,89,0.5)' }}>✨ 靈卡對應簽文啟示 ✨</div>
            <div style={{ width: '100%', flex: 1, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(197, 160, 89, 0.3)', background: '#0a0514', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploadedImages.length > 0 ? (
                <img src={uploadedImages[12 + chosenIndex] || uploadedImages[0]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Fortune" />
              ) : (
                <div style={{ color: '#c5a059', padding: '20px', textAlign: 'center', lineHeight: '2' }}>
                  <p style={{ fontSize: '20px', fontWeight: 'bold' }}>【苗繡·萬物生】</p>
                  <p style={{ fontSize: '13px', color: '#8c734b' }}>千絲萬縷，線连命運之圖騰。<br/>今日所求，皆如银饰般耀眼，终得圆满。</p>
                </div>
              )}
            </div>
            <div style={{ color: 'rgba(197, 160, 89, 0.6)', fontSize: '11px', marginTop: '10px', letterSpacing: '1px' }}>
              {isDissolving ? "✨ 簽文靈力散去，正在歸位牌陣... ✨" : "⏳ 簽文已顯现，停留 5 秒後將化作星塵消散重置"}
            </div>
          </div>
        </div>
      )}

      {/* 手势摄像头预览层 */}
      {isStarted && isSdkLoaded && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 9999, width: '220px', height: '165px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #c5a059', transform: 'scaleX(-1)', background: '#000' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} width={320} height={240} />
        </div>
      )}

      {/* 底部手势操控底栏 */}
      {isStarted && (
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '12px', background: 'rgba(5, 2, 10, 0.95)', padding: '10px', borderRadius: '14px', border: '1px solid #c5a059' }}>
            <button onClick={() => changeState(GESTURES.CHAOS)} style={btnStyle(gestureState === GESTURES.CHAOS)}>🌌 漫天亂飛</button>
            <button onClick={() => changeState(GESTURES.FIST)} style={btnStyle(gestureState === GESTURES.FIST)}>✊ 萬磁王聚攏</button>
            <button onClick={() => changeState(GESTURES.FIVE_FINGERS)} style={btnStyle(gestureState === GESTURES.FIVE_FINGERS)}>🖐 五指無限滾動</button>
            <button onClick={() => changeState(GESTURES.INDEX_SINGLE)} style={btnStyle(gestureState === GESTURES.INDEX_SINGLE)}>☝️ 單指抽牌</button>
            <button onClick={() => changeState(GESTURES.TWO_FINGERS_SCRATCH)} style={btnStyle(gestureState === GESTURES.TWO_FINGERS_SCRATCH)}>✌️ 雙指塗抹</button>
          </div>
          <div style={{ fontSize: '12px', color: '#c5a059', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '1px' }}>
            💡 點擊或使用手勢切換效果。選定單指抽牌後，卡牌放大至中央，即可使用雙指塗抹解鎖！
          </div>
        </div>
      )}
    </div>
  );
}
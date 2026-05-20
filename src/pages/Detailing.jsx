import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, ContactShadows } from '@react-three/drei';
import { Droplets, Sparkles, Shield } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import './Detailing.css';

const CarModel = () => {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4, 1, 2]} />
        <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-0.5, 1.25, 0]}>
        <boxGeometry args={[2, 0.5, 1.8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.2, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[1.2, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-1.2, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[1.2, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

const Detailing = () => {
  const { t } = useTranslation();

  const steps = [
    { icon: <Droplets size={32} />, titleKey: 'detailing.step1', descKey: 'detailing.step1.desc' },
    { icon: <Sparkles size={32} />, titleKey: 'detailing.step2', descKey: 'detailing.step2.desc' },
    { icon: <Shield size={32} />, titleKey: 'detailing.step3', descKey: 'detailing.step3.desc' }
  ];

  return (
    <PageTransition>
      <section className="detailing-page container">
        <div className="detailing-header">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t('detailing.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t('detailing.subtitle')}
          </motion.p>
        </div>

        <div className="detailing-content">
          <motion.div 
            className="detailing-steps"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {steps.map((step, idx) => (
              <div key={idx} className="step-card glass-panel">
                <div className="step-icon">
                  {step.icon}
                </div>
                <div className="step-text">
                  <h3>{t(step.titleKey)}</h3>
                  <p>{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div 
            className="detailing-3d glass-panel"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="canvas-container">
              <Canvas camera={{ position: [5, 3, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                  <CarModel />
                </Float>
                <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
                <Environment preset="city" />
                <OrbitControls enableZoom={false} autoRotate={false} />
              </Canvas>
            </div>
            <div className="canvas-hint">{t('detailing.3d')}</div>
          </motion.div>
        </div>

        <motion.div 
          className="detailing-extras"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="detailing-gallery">
            <h3>{t('detailing.results')}</h3>
            <div className="gallery-grid">
              <img src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=600&auto=format&fit=crop" alt="Result 1" className="gallery-img glass-panel" />
              <img src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=600&auto=format&fit=crop" alt="Result 2" className="gallery-img glass-panel" />
              <img src="https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=600&auto=format&fit=crop" alt="Result 3" className="gallery-img glass-panel" />
            </div>
          </div>

          <div className="detailing-reviews">
            <h3>{t('detailing.reviews')}</h3>
            <div className="reviews-grid">
              <div className="review-card glass-panel">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <p>"Incredible attention to detail. My 5-year-old car looks better than when it left the showroom!"</p>
                <div className="reviewer">- Thomas M.</div>
              </div>
              <div className="review-card glass-panel">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <p>"The ceramic coating is magic. Washing my car now takes 10 minutes and the dirt just slides off."</p>
                <div className="reviewer">- Lukas P.</div>
              </div>
            </div>
          </div>

          <div className="detailing-booking">
            <h3>{t('detailing.booking.title')}</h3>
            <p>{t('detailing.booking.desc')}</p>
            <button className="btn btn-primary btn-large">{t('detailing.booking.btn')}</button>
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
};

export default Detailing;

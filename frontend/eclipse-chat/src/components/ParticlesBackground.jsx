import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const ParticlesBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine); 
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      preset: "nasa",
      background: {
        color: {
          value: "transparent", 
        },
      },
      fullScreen: {
        enable: true,
        zIndex: -1,
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#4125e390",
        },
        links: {
          color: "#f9f9f9e7",
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: 3,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 350,
        },
        opacity: {
          value: 0.3, 
        },
        shape: {
          type: ["circle", "triangle", "square", "pentagon"],
        },
        size: {
          value: { min: 3, max: 5 }, 
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (init) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      overflow: 'hidden !important',
        zIndex: 1,
        pointerEvents: 'none',
      }}>
        <Particles
          id="tsparticles"
          options={options}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    );
  }

};

export default ParticlesBackground;
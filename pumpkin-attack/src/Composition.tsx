import type React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import pumpkinMeta from "./pumpkinMeta.json";

const IMG_W = 3024;
const SCALE = 1080 / IMG_W;

type PumpkinData = (typeof pumpkinMeta)[number];

const sleepDelays = [0, 8, 16, 24] as const;

export const MyComposition = () => {
  return (
    <Composition
      id="PumpkinAttack"
      component={PumpkinAttack}
      durationInFrames={240}
      fps={30}
      width={1080}
      height={1440}
    />
  );
};

const PumpkinAttack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shakeIntensity = interpolate(
    frame,
    [2.1 * fps, 2.4 * fps, 3.2 * fps, 5.5 * fps, 7 * fps],
    [0, 1, 0.85, 0.45, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const shakeX =
    Math.sin(frame * 1.7) * 14 * shakeIntensity +
    Math.cos(frame * 3.1) * 8 * shakeIntensity;
  const shakeY =
    Math.cos(frame * 2.3) * 12 * shakeIntensity +
    Math.sin(frame * 4.2) * 6 * shakeIntensity;

  const flash = interpolate(
    frame,
    [2.35 * fps, 2.5 * fps, 2.75 * fps, 3.6 * fps, 3.75 * fps, 4 * fps],
    [0, 0.55, 0, 0, 0.35, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const vignette = interpolate(frame, [1.5 * fps, 3 * fps], [0.15, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [6.4 * fps, 7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0a09" }}>
      <AbsoluteFill
        style={{
          translate: `${shakeX}px ${shakeY}px`,
        }}
      >
        <Img
          src={staticFile("group.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {pumpkinMeta.map((pumpkin, index) => (
          <AttackPumpkin
            key={pumpkin.id}
            pumpkin={pumpkin}
            delay={sleepDelays[index] ?? 0}
            index={index}
          />
        ))}

        <ImpactBursts />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: `radial-gradient(circle at 50% 40%, transparent 35%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundColor: `rgba(255, 60, 0, ${flash})`,
          mixBlendMode: "screen",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 72,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#ff8a1f",
            textShadow:
              "0 0 18px rgba(255,120,0,0.85), 0 4px 0 #3a1200, 0 10px 30px rgba(0,0,0,0.7)",
            textTransform: "uppercase",
          }}
        >
          They&apos;re alive
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AttackPumpkin: React.FC<{
  pumpkin: PumpkinData;
  delay: number;
  index: number;
}> = ({ pumpkin, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wake = delay + 0.4 * fps;
  const leapStart = delay + 1.1 * fps;
  const leapEnd = leapStart + 1.15 * fps;
  const chompStart = leapEnd;

  // Spirit pumpkin materializes over the real one, then leaps out
  const materialize = interpolate(frame, [wake, wake + 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const wakePulse = interpolate(
    frame,
    [wake, wake + 0.35 * fps, leapStart],
    [0.92, 1.12, 1.06],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    },
  );

  const wobble = interpolate(frame, [wake, leapStart], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leapProgress = interpolate(frame, [leapStart, leapEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.12, 0.85, 0.2, 1),
  });

  const startX = pumpkin.x * SCALE;
  const startY = pumpkin.y * SCALE;
  const width = pumpkin.w * SCALE;
  const height = pumpkin.h * SCALE;

  const endX = pumpkin.targetX * SCALE - width * 0.45;
  const endY = pumpkin.targetY * SCALE - height * 0.4;

  const arc = Math.sin(leapProgress * Math.PI) * (-200 - index * 20);

  const chompT = Math.max(0, frame - chompStart);
  const chompBounce =
    leapProgress >= 1
      ? Math.sin(chompT * 0.55) * 18 + Math.cos(chompT * 0.9) * 10
      : 0;
  const chompX =
    leapProgress >= 1 ? Math.sin(chompT * 0.7 + index) * 22 : 0;

  const x = startX + (endX - startX) * leapProgress + chompX;
  const y =
    startY + (endY - startY) * leapProgress + arc + chompBounce;

  const spin =
    interpolate(frame, [leapStart, leapEnd + 1.2 * fps], [0, 420 + index * 45], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    }) +
    Math.sin(frame * 0.35 + index) * 10 * wobble;

  const glow = interpolate(
    frame,
    [wake, leapStart, chompStart + 0.5 * fps],
    [0, 1, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const scaleBoost =
    wakePulse *
    interpolate(
      frame,
      [leapStart, leapStart + 0.35 * fps, leapEnd, chompStart + 0.3 * fps],
      [1, 1.35, 1.2, 1.1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity: materialize,
        rotate: `${spin + Math.sin(frame * 0.5 + index) * 8 * wobble}deg`,
        scale: scaleBoost,
        filter: `drop-shadow(0 0 ${22 * glow}px rgba(255,120,0,${0.9 * glow})) drop-shadow(0 ${12 + 24 * leapProgress}px ${20 + 12 * leapProgress}px rgba(0,0,0,0.5))`,
        zIndex: 10 + index + Math.round(leapProgress * 10),
        transformOrigin: "50% 50%",
      }}
    >
      <Img
        src={staticFile(pumpkin.file)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <GlowingEyes intensity={glow} seed={index} />
    </div>
  );
};

const GlowingEyes: React.FC<{ intensity: number; seed: number }> = ({
  intensity,
  seed,
}) => {
  const frame = useCurrentFrame();
  const flicker =
    0.75 +
    0.25 * Math.sin(frame * 0.9 + seed * 2) +
    0.1 * random(`eye-${seed}-${Math.floor(frame / 2)}`);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: intensity * flicker,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "32%",
          top: "38%",
          width: "12%",
          height: "10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #ffe566 0%, #ff8a00 45%, transparent 75%)",
          boxShadow: "0 0 16px 6px rgba(255,160,0,0.85)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "56%",
          top: "38%",
          width: "12%",
          height: "10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #ffe566 0%, #ff8a00 45%, transparent 75%)",
          boxShadow: "0 0 16px 6px rgba(255,160,0,0.85)",
        }}
      />
    </div>
  );
};

const ImpactBursts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {pumpkinMeta.map((pumpkin, index) => {
        const delay = sleepDelays[index] ?? 0;
        const impactAt = delay + 2.25 * fps;
        const t = frame - impactAt;
        if (t < 0 || t > 1.2 * fps) {
          return null;
        }

        const progress = t / (1.2 * fps);
        const cx = pumpkin.targetX * SCALE;
        const cy = pumpkin.targetY * SCALE;

        return (
          <div key={`burst-${pumpkin.id}`}>
            {Array.from({ length: 10 }).map((_, i) => {
              const ang = (i / 10) * Math.PI * 2 + index;
              const dist = interpolate(progress, [0, 1], [0, 90 + (i % 3) * 24], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              });
              const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const size = 10 + (i % 4) * 4;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: cx + Math.cos(ang) * dist,
                    top: cy + Math.sin(ang) * dist * 0.85,
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    opacity,
                    background:
                      i % 2 === 0
                        ? "radial-gradient(circle, #ffe08a, #ff6a00)"
                        : "radial-gradient(circle, #fff3c4, #ff9a1f)",
                    boxShadow: "0 0 10px rgba(255,140,0,0.8)",
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
};

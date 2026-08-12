"use client";

import { useState } from "react";
import { HERO_VIDEOS } from "../lib/constants";

export default function HeroVideo() {
  const [currentVideo, setCurrentVideo] = useState(0);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_VIDEOS.map((video, index) => (
        <video
          key={video}
          autoPlay
          muted
          playsInline
          onEnded={() =>
            setCurrentVideo((prev) => (prev + 1) % HERO_VIDEOS.length)
          }
          className={`

            absolute

            inset-0

            h-full

            w-full

            object-cover

            transition-opacity

            duration-[1800ms]

            ${currentVideo === index ? "opacity-100" : "opacity-0"}

          `}
        >
          <source src={video} type="video/mp4" />
        </video>
      ))}

      {/* Dark overlay */}

      <div className="absolute inset-0 bg-black/50" />

      {/* Navy gradient */}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,21,45,.15) 0%, rgba(6,21,45,.75) 100%)",
        }}
      />

      {/* Red light */}

      <div
        className="absolute"
        style={{
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "#D32F2F",
          filter: "blur(180px)",
          opacity: 0.12,
          left: -180,
          top: -180,
        }}
      />

      {/* Blue light */}

      <div
        className="absolute"
        style={{
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "#2563EB",
          filter: "blur(240px)",
          opacity: 0.1,
          right: -240,
          top: 120,
        }}
      />

      {/* Bottom fade */}

      <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-b from-transparent to-[#07152D]" />
    </div>
  );
}

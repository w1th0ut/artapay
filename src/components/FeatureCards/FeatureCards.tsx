"use client";

import { FeatureCardEffect, FeatureCardItem } from './FeatureCardItem';
import { useScroll, useTransform } from "motion/react";
import React from "react";

export default function FeatureCards() {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // "start end" = progress 0 ketika top container baru menyentuh bottom viewport
    // "center center" = progress 1 ketika center container di center viewport
    offset: ["start end", "center center"],
  });

  // Stroke animation: selesai di 60% scroll progress
  // pathLength dimulai dari 0 (tidak terlihat) dan berakhir di 1.2 di progress 0.6
  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

  // Content opacity: fade in lebih smooth (0.4 to 0.8) - tidak terlalu cepat
  const contentOpacity = useTransform(scrollYProgress, [0.6, 0.9], [0, 1]);

  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

  const features: FeatureCardItem[] = [
    {
      title: "Paymaster",
      description: "Kalimat dengan maksimal lima kata",
    },
    {
      title: "Paymaster",
      description: "Kalimat dengan maksimal lima kata",
    },
    {
      title: "Paymaster",
      description: "Kalimat dengan maksimal lima kata",
    },
  ];

  return (
    // Container untuk scroll tracking
    // Height cukup untuk memberikan ruang scroll selama animasi
    <div
      className="min-h-[150vh] bg-black w-full relative"
      ref={ref}
      style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
    >
      <FeatureCardEffect
        items={features}
        contentOpacity={contentOpacity}
        pathLengths={[
          pathLengthFirst,
          pathLengthSecond,
          pathLengthThird,
          pathLengthFourth,
          pathLengthFifth,
        ]}
      />
    </div>
  );
}
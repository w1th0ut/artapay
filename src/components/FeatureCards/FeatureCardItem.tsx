"use client";
import { cn } from "@/lib/utils";
import { motion, MotionValue } from "motion/react";

const transition = {
  duration: 0,
  ease: "linear" as const,
};

export interface FeatureCardItem {
  title: string;
  description: string;
}

export const FeatureCardEffect = ({
  pathLengths,
  contentOpacity,
  items,
  className,
}: {
  pathLengths: MotionValue[];
  contentOpacity: MotionValue;
  items: FeatureCardItem[];
  className?: string;
}) => {
  return (
    // Sticky container dengan top offset untuk memberi ruang header
    // Menggunakan calc untuk memastikan cards tetap centered secara vertikal
    <div
      className={cn(
        "sticky top-0 min-h-screen w-full flex items-center justify-center py-20",
        className
      )}
    >
      {/* Cards Container - Flexbox for responsive layout */}
      <div className="flex flex-row gap-8 items-center justify-center flex-wrap px-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative w-[240px] h-[320px] flex flex-col items-start justify-center px-6 gap-4"
          >
            {/* Content - Animated opacity */}
            <motion.div
              className="relative z-10 flex flex-col items-start gap-4"
              style={{ opacity: contentOpacity }}
            >
              <h3
                className="font-hero text-2xl text-white"
                style={{ fontVariant: 'small-caps' }}
              >
                {item.title}
              </h3>
              <p className="font-sans text-sm text-[#C9A227] italic leading-relaxed">
                {item.description}
              </p>
            </motion.div>

            {/* SVG Border - Positioned absolutely within card */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 240 320"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.rect
                x="0"
                y="0"
                width="240"
                height="320"
                rx="16"
                ry="16"
                stroke="#C9A227"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                style={{ pathLength: pathLengths[index] || pathLengths[0] }}
                transition={transition}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};
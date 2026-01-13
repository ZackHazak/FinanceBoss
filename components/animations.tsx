"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import React from "react"

// Smooth spring config for natural feeling animations
const smoothSpring = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
}

// Fast tween for simple transitions
const fastTween = {
    type: "tween" as const,
    ease: [0.25, 0.1, 0.25, 1] as const, // CSS ease equivalent
    duration: 0.2,
}

// Page transition variants - optimized for smoothness
const pageVariants = {
    initial: {
        opacity: 0,
        y: 8,
    },
    animate: {
        opacity: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        y: -8,
    },
}

const pageTransition = {
    type: "tween" as const,
    ease: [0.25, 0.1, 0.25, 1] as const,
    duration: 0.15,
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                style={{ willChange: "opacity, transform" }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

// Fade in animation for individual elements
export function FadeIn({
    children,
    delay = 0,
    duration = 0.2,
    className = "",
}: {
    children: React.ReactNode
    delay?: number
    duration?: number
    className?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
            style={{ willChange: "opacity" }}
        >
            {children}
        </motion.div>
    )
}

// Slide up animation for cards and list items
export function SlideUp({
    children,
    delay = 0,
    duration = 0.2,
    className = "",
}: {
    children: React.ReactNode
    delay?: number
    duration?: number
    className?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1]
            }}
            className={className}
            style={{ willChange: "opacity, transform" }}
        >
            {children}
        </motion.div>
    )
}

// Scale animation for buttons and interactive elements
export function ScaleOnTap({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            transition={{ type: "tween", duration: 0.1 }}
            className={className}
            style={{ willChange: "transform" }}
        >
            {children}
        </motion.div>
    )
}

// Stagger children animation for lists
export function StaggerContainer({
    children,
    staggerDelay = 0.03,
    className = "",
}: {
    children: React.ReactNode
    staggerDelay?: number
    className?: string
}) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: 0.02,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Individual item for stagger container
export function StaggerItem({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 8 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        type: "tween",
                        ease: [0.25, 0.1, 0.25, 1],
                        duration: 0.2,
                    }
                },
            }}
            className={className}
            style={{ willChange: "opacity, transform" }}
        >
            {children}
        </motion.div>
    )
}

// Animated card with hover effect
export function AnimatedCard({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode
    className?: string
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "tween",
                ease: [0.25, 0.1, 0.25, 1],
                duration: 0.2,
                delay
            }}
            whileHover={{
                scale: 1.01,
                transition: { type: "tween", duration: 0.15 }
            }}
            className={className}
            style={{ willChange: "opacity, transform" }}
        >
            {children}
        </motion.div>
    )
}

// Collapse/Expand animation
export function Collapse({
    isOpen,
    children,
    className = "",
}: {
    isOpen: boolean
    children: React.ReactNode
    className?: string
}) {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        type: "tween",
                        ease: [0.25, 0.1, 0.25, 1],
                        duration: 0.2
                    }}
                    className={className}
                    style={{ overflow: "hidden", willChange: "height, opacity" }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Number counter animation
export function AnimatedNumber({
    value,
    duration = 0.3,
    className = "",
}: {
    value: number
    duration?: number
    className?: string
}) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "tween",
                ease: [0.25, 0.1, 0.25, 1],
                duration: duration / 2
            }}
            className={className}
            style={{ willChange: "opacity, transform" }}
        >
            {value.toLocaleString('he-IL')}
        </motion.span>
    )
}

// Slide in from side (RTL aware)
export function SlideInFromSide({
    children,
    delay = 0,
    className = "",
}: {
    children: React.ReactNode
    delay?: number
    className?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                type: "tween",
                ease: [0.25, 0.1, 0.25, 1],
                duration: 0.2,
                delay
            }}
            className={className}
            style={{ willChange: "opacity, transform" }}
        >
            {children}
        </motion.div>
    )
}

// Pulse animation for notifications/badges
export function Pulse({
    children,
    className = "",
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div
            animate={{
                scale: [1, 1.03, 1],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            className={className}
            style={{ willChange: "transform" }}
        >
            {children}
        </motion.div>
    )
}

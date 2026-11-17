import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const NO_MOTION_OK = '(prefers-reduced-motion: no-preference)'
export { gsap, ScrollTrigger, useGSAP }

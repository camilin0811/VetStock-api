import { Component, type ReactNode } from 'react'

/** Si WebGL falla, se queda el fallback estatico en lugar de romper la pagina. */
export class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false }
  static getDerivedStateFromError() { return { fallo: true } }
  render() { return this.state.fallo ? this.props.fallback : this.props.children }
}

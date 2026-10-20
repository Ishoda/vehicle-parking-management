import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  House,
  MapPinOff,
  ShieldAlert,
} from 'lucide-react'

export default function ErrorPage({ code, title, description }) {
  const denied = code === '403'
  const PageIcon = denied ? ShieldAlert : MapPinOff

  return (
    <section className="error-page" aria-labelledby="error-page-title">
      <div className="error-page-glow" aria-hidden="true" />

      <div className="error-page-content">
        <span className="error-page-tag">
          <span aria-hidden="true" />
          {denied ? 'RESTRICTED AREA' : 'WRONG TURN'}
        </span>

        <div className="error-page-art" aria-hidden="true">
          <span className="error-page-code">{code}</span>
          <span className="error-page-icon">
            <PageIcon size={45} strokeWidth={1.6} />
          </span>
        </div>

        <h1 id="error-page-title">{title}</h1>
        <p className="error-page-description">{description}</p>

        <Link to="/" className="error-home-button">
          <House size={17} />
          Back to dashboard
          <ArrowRight size={17} />
        </Link>

        {denied && (
          <p className="error-page-help">
            Need access? Contact your administrator.
          </p>
        )}

        <div className="error-page-road" aria-hidden="true">
          <ArrowLeft size={16} />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <span className="error-page-footer">
          PARKLY · PARKING MANAGEMENT
        </span>
      </div>
    </section>
  )
}
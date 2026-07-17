import "./Home.css";

const features = [
  {
    title: "Property Management",
    description:
      "Manage buildings, units, occupancy and rental operations from one place.",
    className: "large",
  },
  {
    title: "Tenant Portal",
    description:
      "Enable seamless communication between tenants and property managers.",
  },
  {
    title: "Rent Tracking",
    description:
      "Monitor payments, due dates and rental history with ease.",
  },
  {
    title: "Maintenance Requests",
    description:
      "Track service requests, updates and repairs efficiently.",
    className: "wide",
  },
];

const benefits = [
  {
    title: "Modern Interface",
    text: "A clean and intuitive experience designed for speed and productivity.",
  },
  {
    title: "Secure Platform",
    text: "Built with security and reliability at the core.",
  },
  {
    title: "Easy Communication",
    text: "Keep tenants and managers connected in one platform.",
  },
  {
    title: "Built For Growth",
    text: "Scale from a single property to an entire portfolio.",
  },
];

export default function Home() {
  return (
    <div className="home">
      {/* BACKGROUND GLOWS */}
      <div className="glow glow-one"></div>
      <div className="glow glow-two"></div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-box">R</div>
          <span>Rentora</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#why">Why Rentora</a>
          <a href="/login">Login</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          Intelligent Property Management Platform
        </div>

        <h1>
          Manage Properties.
          <br />
          <span>Empower Tenants.</span>
        </h1>

        <p>
          Rentora brings landlords, property managers and tenants
          together in one modern platform for rental management,
          communication, maintenance requests and payment tracking.
        </p>

        {/* FLOATING CARDS */}
        <div className="floating-cards">
          <div className="floating-card">
            <h4>Property Management</h4>
            <p>Manage units and occupancy.</p>
          </div>

          <div className="floating-card">
            <h4>Tenant Portal</h4>
            <p>Fast communication tools.</p>
          </div>

          <div className="floating-card">
            <h4>Maintenance</h4>
            <p>Track repair requests easily.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="features">
        <div className="section-title">
          <span>FEATURES</span>

          <h2>
            Everything You Need
            <br />
            To Manage Rentals
          </h2>
        </div>

        <div className="bento-grid">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`bento-card ${feature.className || ""}`}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY RENTORA */}
      <section id="why" className="why-rentora">
        <div className="section-title">
          <span>WHY RENTORA</span>

          <h2>
            Designed For Modern
            <br />
            Property Management
          </h2>
        </div>

        <div className="benefits-grid">
          {benefits.map((item) => (
            <div className="benefit-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <h3>Rentora</h3>

        <p>
          © 2026 Rentora. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
export default function Contact() {
  return (
    <div className="container py-5">
      <h2 className="fw-bold text-primary text-center mb-3">Contáctanos</h2>
      <p className="text-center text-secondary">
        Si tienes dudas o sugerencias sobre las capacitaciones, puedes escribirnos:
      </p>

      <form className="mx-auto mt-4">
        <div className="mb-3">
          <label className="form-label">Nombre completo</label>
          <input type="text" className="form-control" placeholder="Tu nombre" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Correo electrónico</label>
          <input type="email" className="form-control" placeholder="tu@correo.com" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Mensaje</label>
          <textarea className="form-control" rows="4" placeholder="Escribe tu mensaje..." required></textarea>
        </div>
        <button type="submit" className="btn btn-primary w-100">
          <i className="bi bi-send me-2"></i> Enviar mensaje
        </button>
      </form>
    </div>
  );
}

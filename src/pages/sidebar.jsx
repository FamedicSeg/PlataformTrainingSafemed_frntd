// Sidebar.jsx (React JS)
import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, ChevronDown } from "lucide-react";
import "../styles/pages/sidebar.css";

export default function Sidebar({ onNavigate, activeView }) {
  const [openMenu, setOpenMenu] = useState(null);

  const links = [
    { to: "usuarios", label: "Usuarios", icon: Users },

    {
      label: "Procesos",
      icon: BookOpen,
      children: [
        { to: "Talento Humano", label: "Talento Humano" },
        { to: "Control de Calidad", label: "Control de Calidad" },
        { to: "Dirección", label: "Dirección" },
        { to: "Aseguramiento de la Calidad", label: "Aseguramiento de la Calidad" },
      ],
    },

    { to: "Resultados", label: "Resultados", icon: ClipboardList },
  ];

  // ✅ Abre automáticamente "Procesos" si estás en alguna vista hija
  useEffect(() => {
    const procesos = links.find((x) => x.label === "Procesos");
    const isInProcesos =
      procesos?.children?.some((c) => c.to === openMenu) ||
      false;

    if (isInProcesos) setOpenMenu("Procesos");
  }, [openMenu]);

  const toggleMenu = (label) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">DH</div>
        <div>
          <div className="sidebar__title">DHISVE</div>
          <div className="sidebar__subtitle">Panel Admin</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {links.map((item) => {
          const Icon = item.icon;

          // 🔹 ITEM CON SUBMENÚ
          if (item.children) {
            const isOpen = openMenu === item.label;

            return (
              <div key={item.label} className="sidebar__group">
                <button
                  type="button"
                  className={`sidebar__link sidebar__link--button ${
                    isOpen ? "is-open" : ""
                  }`}
                  onClick={() => toggleMenu(item.label)}
                >
                  <span className="sidebar__left">
                    <Icon size={18} className="sidebar__icon" />
                    <span>{item.label}</span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`chevron ${isOpen ? "open" : ""}`}
                  />
                </button>

                <div className={`sidebar__submenu ${isOpen ? "show" : ""}`}>
                  {item.children.map((child) => (
                    <button
                      key={child.to}
                      onClick={() => onNavigate(child.to)}
                      className={`sidebar__sublink ${activeView === child.to ? "is-active" : ""}`}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // 🔹 ITEM NORMAL
          return (
            <button
              key={item.to}
              onClick={() => onNavigate(item.to)}
              className={`sidebar__link ${activeView === item.to ? "is-active" : ""}`}
            >
              <Icon size={18} className="sidebar__icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__logout" onClick={() => window.location.href = '/'}>
          Salir
        </button>
      </div>
    </aside>
  );
}

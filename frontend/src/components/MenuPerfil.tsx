import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import Link from "next/link";
import { logout } from "@/services/authService";

export default function MenuPerfil() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="text-white hover:bg-white/20 p-2 rounded-md transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menu de perfil"
      >
        <User className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 py-2 border">
          <Link
            href="/perfil"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            Ver perfil
          </Link>
          <button
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={logout}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

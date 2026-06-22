import { company } from '../data/company';

export function CompanyFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 px-6 py-2">
      <p className="text-xs text-cream-200/35 text-center tracking-wide">
        © {new Date().getFullYear()}&nbsp;&nbsp;{company.razonSocial} — NIT: {company.nit} — {company.ciudad} — {company.email} — {company.telefono}
      </p>
    </footer>
  );
}

import { ModuloEnConstruccion } from '../components/ModuloEnConstruccion';

export default function GestionOperativaPage() {
  return (
    <ModuloEnConstruccion
      titulo="Gestión Operativa"
      descripcion="Módulo en construcción. Por ahora puedes acceder a la Calculadora de Nómina desde Información General."
      linkTo="/informacion-general?tab=calculadoras"
      linkLabel="Ir a Calculadora de Nómina"
    />
  );
}

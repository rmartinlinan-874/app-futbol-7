/**
 * Pantalla de bienvenida con el logo, al abrir la app. Se queda unos segundos
 * (y, si los datos tardan más, hasta que estén cargados) y luego se desvanece.
 * Tocándola se salta.
 */
export default function Bienvenida({ nombrePeña = 'Peña...', saliendo = false, onSaltar }) {
  return (
    <div className={`bienvenida ${saliendo ? 'saliendo' : ''}`} onClick={onSaltar} role="presentation">
      <img
        className="bienvenida-logo"
        src={`${import.meta.env.BASE_URL}logo-bienvenida.png`}
        alt="Logo de la peña: se busca patrocinador"
        width="220"
        height="220"
      />
      <h1 className="bienvenida-nombre">{nombrePeña}</h1>
      <p className="bienvenida-lema">Se busca patrocinador · Aceptamos camisetas, balones o cerveza</p>
      <span className="bienvenida-balon" aria-hidden="true">
        ⚽
      </span>
    </div>
  )
}

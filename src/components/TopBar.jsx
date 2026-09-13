export default function TopBar({ nombrePeña, peñista, onCambiarPeñista }) {
  return (
    <header className="barra-superior">
      <div>
        <h1>{nombrePeña}</h1>
        <span className="quien">{peñista?.nombre}</span>
      </div>
      <button onClick={onCambiarPeñista}>Cambiar</button>
    </header>
  )
}

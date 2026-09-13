function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function Avatar({ nombre, fotoURL, tamaño = 40 }) {
  const estilo = {
    width: tamaño,
    height: tamaño,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: tamaño * 0.4,
    color: 'white',
    background: 'var(--verde)',
    overflow: 'hidden',
  }

  if (fotoURL) {
    return (
      <div style={estilo}>
        <img
          src={fotoURL}
          alt={nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  return <div style={estilo}>{iniciales(nombre)}</div>
}

import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const LADO_MAX = 256
const CALIDAD_JPEG = 0.75

// Las fotos se guardan como data URL directamente en el documento del
// peñista (sin Firebase Storage: requiere plan de pago Blaze). Por eso se
// redimensionan agresivamente a un avatar pequeño -no hace falta más
// resolución que esa para un círculo de 40px- y así el documento se queda
// muy por debajo del límite de 1 MB de Firestore.
function redimensionarADataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height))
      const ancho = Math.round(img.width * escala)
      const alto = Math.round(img.height * escala)
      const canvas = document.createElement('canvas')
      canvas.width = ancho
      canvas.height = alto
      canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

export async function subirFotoPeñista(peñistaId, file) {
  const fotoURL = await redimensionarADataUrl(file)
  await updateDoc(doc(db, 'penistas', peñistaId), { fotoURL })
  return fotoURL
}

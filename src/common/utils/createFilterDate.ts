import { Between, LessThanOrEqual } from 'typeorm'

export const createFilterDate = (fechaDesde, fechaHasta) => {
  const fechaDesdeDate = new Date(fechaDesde)
  const fechaHastaDate = new Date(fechaHasta)
  const fechaHastaFilter = new Date(
    fechaHastaDate.setDate(fechaHastaDate.getDate() + 1)
  )
  return {
    ...(fechaDesde &&
      fechaHasta && {
        createdAt: Between(fechaDesdeDate, fechaHastaFilter),
      }),
    ...(fechaDesde &&
      !fechaHasta && {
        createdAt: Between(fechaDesdeDate, new Date()),
      }),
    ...(fechaHasta &&
      !fechaDesde && {
        createdAt: LessThanOrEqual(fechaHastaFilter),
      }),
  }
}

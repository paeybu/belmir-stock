import { prisma } from '@/lib/prisma'
import StocktakeClient from './StocktakeClient'

export default async function StocktakePage(props: {
  searchParams: Promise<{ locationId?: string }>
}) {
  const { locationId } = (await props.searchParams) ?? {}

  const locations = await prisma.location.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
  })

  const stockItems = locationId
    ? await prisma.stock.findMany({
        where: { locationId: locationId as string },
        include: { product: true },
        orderBy: { product: { name: 'asc' } },
      })
    : []

  // Also include products with no stock yet at this location
  const allProducts = locationId
    ? await prisma.product.findMany({ where: { archived: false }, orderBy: { name: 'asc' } })
    : []

  type StockItem = (typeof stockItems)[number]
  type AnyProduct = (typeof allProducts)[number]
  const stockMap = new Map(stockItems.map((s: StockItem) => [s.productId, s.quantity]))
  const items = allProducts.map((p: AnyProduct) => ({ productId: p.id, productName: p.name, unit: p.unit, currentQty: stockMap.get(p.id) ?? 0 }))

  return <StocktakeClient locations={locations} selectedLocationId={locationId as string | undefined} items={items} />
}

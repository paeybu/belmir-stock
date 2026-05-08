import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from '@prisma/config'

config({ path: path.resolve(__dirname, '.env') })
config({ path: path.resolve(__dirname, '.env.local'), override: false })

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})

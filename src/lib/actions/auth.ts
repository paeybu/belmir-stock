'use server'
import { signIn, signOut } from '@/lib/auth'

export async function login(formData: FormData) {
  await signIn('credentials', {
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: '/',
  })
}

export async function logout() {
  await signOut({ redirectTo: '/login' })
}

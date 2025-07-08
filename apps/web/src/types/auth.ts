export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export interface AuthState {
  user: any | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signUp: (data: SignUpFormData) => Promise<void>
  signIn: (data: SignInFormData) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}
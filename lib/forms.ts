export type FormState = {
  status: 'idle' | 'error' | 'success'
  message: string
  errors?: Record<string, string[] | undefined>
}
export const initialFormState: FormState = { status: 'idle', message: '' }

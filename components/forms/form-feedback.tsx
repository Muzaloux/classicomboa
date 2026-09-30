import type { FormState } from '../../lib/forms'

export function FormFeedback({ state }: { state: FormState }) {
  return <div aria-live="polite" aria-atomic="true">
    {state.message && <p className={'form-feedback ' + state.status} role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>}
    {state.errors && <ul className="form-errors">{Object.entries(state.errors).flatMap(([field, errors]) => errors?.map((message) => <li key={field + message}>{message}</li>) ?? [])}</ul>}
  </div>
}

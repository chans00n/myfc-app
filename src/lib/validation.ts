export type ValidationError = {
  field: string
  message: string
}

export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: 'email', message: 'Email is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' }
  }
  return null
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: 'Password is required' }
  }
  if (password.length < 6) {
    return { field: 'password', message: 'Password must be at least 6 characters' }
  }
  return null
}

export function validateFullName(fullName: string): ValidationError | null {
  if (!fullName) {
    return { field: 'full-name', message: 'Full name is required' }
  }
  if (fullName.length < 2) {
    return { field: 'full-name', message: 'Full name must be at least 2 characters' }
  }
  return null
}

export function validateForm(
  email: string,
  password: string,
  fullName?: string
): ValidationError[] {
  const errors: ValidationError[] = []
  
  const emailError = validateEmail(email)
  if (emailError) errors.push(emailError)
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.push(passwordError)
  
  if (fullName) {
    const fullNameError = validateFullName(fullName)
    if (fullNameError) errors.push(fullNameError)
  }
  
  return errors
} 
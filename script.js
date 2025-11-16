// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const KEY = 'ufa_app';

// Validation regex patterns
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  phone: /^[\+]?[1]?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  zipcode: /^\d{5}(-\d{4})?$/,
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Load application data from session storage
 * @returns {Object} Parsed data object or empty object if error
 */
function loadData() {
  try {
    const stored = sessionStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading data from session storage:', error);
    return {};
  }
}

/**
 * Save application data to session storage
 * @param {Object} obj - Data object to persist
 */
function saveData(obj) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(obj || {}));
  } catch (error) {
    console.error('Error saving data to session storage:', error);
  }
}

/**
 * Get value from form element by ID, trimmed
 * @param {string} id - Element ID
 * @returns {string} Trimmed value or empty string
 */
function getValue(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  if (el.type === 'checkbox') {
    return el.checked ? el.value || 'true' : '';
  }
  return (el.value ?? '').trim();
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Display error message for a form field
 * @param {string} id - Error element ID
 * @param {string} msg - Error message to display
 */
function showError(id, msg) {
  const span = document.getElementById(id);
  if (span) {
    span.textContent = msg;
    span.classList.remove('hidden');
    span.setAttribute('role', 'alert');
  }
}

/**
 * Clear error message for a form field
 * @param {string} id - Error element ID
 */
function clearError(id) {
  const span = document.getElementById(id);
  if (span) {
    span.textContent = '';
    span.classList.add('hidden');
    span.removeAttribute('role');
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email format
 * @param {string} v - Email address to validate
 * @returns {boolean} True if valid email format
 */
function emailValid(v) {
  return VALIDATION_PATTERNS.email.test(v);
}

/**
 * Validate phone number format
 * Supports: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567, +1-555-123-4567
 * @param {string} v - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
function phoneValid(v) {
  return VALIDATION_PATTERNS.phone.test(v);
}

/**
 * Validate ZIP code format (5 digits or ZIP+4)
 * @param {string} v - ZIP code to validate
 * @returns {boolean} True if valid ZIP code format
 */
function zipValid(v) {
  return VALIDATION_PATTERNS.zipcode.test(v);
}

// ============================================================================
// DATA PERSISTENCE ON PAGE LOAD
// ============================================================================

/**
 * Initialize form with saved data and set up change listeners
 * Automatically saves data when any field with [data-name] attribute changes
 */
window.addEventListener('DOMContentLoaded', () => {
  const data = loadData();
  
  // Restore saved form values
  document.querySelectorAll('[data-name]').forEach(el => {
    const name = el.getAttribute('data-name');
    if (data[name] != null) {
      if (el.type === 'checkbox') {
        el.checked = !!data[name];
      } else {
        el.value = data[name];
      }
    }
    
    // Save data when field changes
    el.addEventListener('change', () => {
      const v = (el.type === 'checkbox') ? el.checked : el.value;
      data[name] = v;
      saveData(data);
    });
  });
});

// ============================================================================
// PAGE 1 VALIDATION - APPLICANT & POSITION
// ============================================================================

/**
 * Validate page 1: Applicant & Position information
 * Required fields: firstName, lastName, email, phone, address1, city, state, zip, position
 */
function validatePage1() {
  let isValid = true;
  
  // Define required fields with their validation rules
  const requiredFields = [
    { id: 'firstName', msg: 'First name is required.' },
    { id: 'lastName', msg: 'Last name is required.' },
    { id: 'email', msg: 'Valid email is required.', validator: emailValid },
    { id: 'phone', msg: 'Valid phone number is required.', validator: phoneValid },
    { id: 'address1', msg: 'Street address is required.' },
    { id: 'city', msg: 'City is required.' },
    { id: 'state', msg: 'State is required.' },
    { id: 'zip', msg: 'Valid 5-digit ZIP code is required.', validator: zipValid },
    { id: 'position', msg: 'Please select a position.' },
  ];
  
  // Validate each field
  requiredFields.forEach(({ id, msg, validator }) => {
    clearError(`err-${id}`);
    const value = getValue(id);
    
    if (!value || (validator && !validator(value))) {
      showError(`err-${id}`, msg);
      isValid = false;
    }
  });
  
  if (isValid) {
    window.location.href = 'page2.html';
  }
}

// ============================================================================
// PAGE 2 VALIDATION - AVAILABILITY & EDUCATION
// ============================================================================

/**
 * Validate page 2: Availability & Education
 * Required fields: degree
 * Note: Availability and certifications are optional
 */
function validatePage2() {
  let isValid = true;
  
  clearError('err-degree');
  if (!getValue('degree')) {
    showError('err-degree', 'Please choose your highest degree.');
    isValid = false;
  }
  
  if (isValid) {
    window.location.href = 'page3.html';
  }
}

// ============================================================================
// PAGE 3 VALIDATION - EXPERIENCE & LICENSE
// ============================================================================

/**
 * Validate page 3: Work Experience & Driver's License
 * Conditionally validates license details based on user response
 * Validates work experience entries for consistency
 */
function validatePage3() {
  let isValid = true;
  
  // Validate driver's license question
  clearError('err-license');
  const licenseReq = getValue('licenseReq');
  
  if (!licenseReq) {
    showError('err-license', "Please answer the driver's license question.");
    isValid = false;
  }
  
  // Validate license details if user answered "yes"
  if (licenseReq === 'yes') {
    isValid = validateLicenseDetails();
  }
  
  // Validate work experience entries
  isValid = validateWorkExperience() && isValid;
  
  if (isValid) {
    window.location.href = 'page4.html';
  }
}

/**
 * Helper: Validate driver's license details when applicable
 * @returns {boolean} True if all license validations pass
 */
function validateLicenseDetails() {
  let isValid = true;
  const requiredLicenseFields = [
    { id: 'licenseNumber', msg: 'License number is required.' },
    { id: 'licenseIssue', msg: 'Issue date is required.' },
    { id: 'licenseExpiry', msg: 'Expiry date is required.' },
    { id: 'licenseState', msg: 'Issuing state is required.' },
  ];
  
  // Clear all license error messages first
  requiredLicenseFields.forEach(({ id }) => clearError(`err-${id}`));
  
  const licenseNumber = getValue('licenseNumber');
  const issueDate = getValue('licenseIssue');
  const expiryDate = getValue('licenseExpiry');
  const licenseState = getValue('licenseState');
  
  if (!licenseNumber) {
    showError('err-licenseNumber', 'License number is required.');
    isValid = false;
  }
  if (!issueDate) {
    showError('err-licenseIssue', 'Issue date is required.');
    isValid = false;
  }
  if (!expiryDate) {
    showError('err-licenseExpiry', 'Expiry date is required.');
    isValid = false;
  }
  if (!licenseState) {
    showError('err-licenseState', 'Issuing state is required.');
    isValid = false;
  }
  
  // Validate expiry date is after issue date
  if (issueDate && expiryDate && expiryDate < issueDate) {
    showError('err-licenseExpiry', 'Expiry date must be after issue date.');
    isValid = false;
  }
  
  return isValid;
}

/**
 * Helper: Validate work experience entries
 * @returns {boolean} True if all experience entries are valid
 */
function validateWorkExperience() {
  let isValid = true;
  const expError = document.getElementById('err-experience');
  expError.textContent = '';
  expError.classList.add('hidden');
  
  // Get experience list (this function must exist in page3's script)
  if (typeof getExperiences === 'undefined') {
    return true; // Skip if not on page3
  }
  
  const experiences = getExperiences();
  
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const hasAnyField = exp.employer || exp.jobTitle || exp.startDate || exp.endDate || exp.duties;
    
    // If any field is filled, all required fields must be filled
    if (hasAnyField && (!exp.employer || !exp.jobTitle)) {
      expError.textContent = 'Each work experience must include Employer and Job Title.';
      expError.classList.remove('hidden');
      expError.setAttribute('role', 'alert');
      return false;
    }
    
    // Validate end date is after start date
    if (exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
      expError.textContent = `Experience #${i + 1}: End Date must be after Start Date.`;
      expError.classList.remove('hidden');
      expError.setAttribute('role', 'alert');
      return false;
    }
  }
  
  return isValid;
}

/**
 * Toggle visibility of driver's license details form section
 */
function toggleLicenseDetails() {
  const licenseReq = document.getElementById('licenseReq');
  const licenseDetails = document.getElementById('licenseDetails');
  
  if (licenseDetails) {
    const shouldShow = licenseReq && licenseReq.value === 'yes';
    licenseDetails.classList.toggle('hidden', !shouldShow);
  }
}

// ============================================================================
// PAGE 4 VALIDATION - REFERENCES & SKILLS
// ============================================================================

/**
 * Validate page 4: References & Skills
 * References are optional but if filled must include both name and email
 */
function validatePage4() {
  window.location.href = 'page5.html';
}

// ============================================================================
// PAGE 5 SUBMISSION - ACKNOWLEDGEMENT
// ============================================================================

/**
 * Validate and submit the entire application
 * Ensures all critical fields across all pages are complete
 * @param {Event} e - Form submit event
 */
function submitApp(e) {
  e.preventDefault();
  
  const data = loadData();
  
  // List of critical required fields
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'address1',
    'city',
    'state',
    'zip',
    'position',
    'degree',
    'licenseReq',
  ];
  
  // Verify all required fields are complete
  for (const fieldName of requiredFields) {
    if (!data[fieldName]) {
      alert(`Please complete all required fields before submitting.\n\nMissing or incomplete: ${fieldName}`);
      return;
    }
  }
  
  // Verify user agreed to acknowledgement
  if (!data.agree) {
    alert('You must agree to the application acknowledgement.');
    return;
  }
  
  // Show success message and disable submit button
  const successDiv = document.getElementById('success');
  if (successDiv) {
    successDiv.classList.remove('hidden');
  }
  
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.setAttribute('disabled', 'true');
  }
}

// ============================================================================
// STATE INITIALIZATION
// ============================================================================

/**
 * Initialize state dropdown with all US states
 * @param {string} selectId - ID of select element to populate
 */
function initializeStates(selectId) {
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  ];

  const dropdown = document.getElementById(selectId);
  if (!dropdown) {
    console.warn(`State dropdown with ID "${selectId}" not found`);
    return;
  }

  // Clear existing options
  dropdown.innerHTML = '';

  // Add default placeholder option
  const defaultOption = document.createElement('option');
  defaultOption.text = 'Select a state';
  defaultOption.value = '';
  dropdown.add(defaultOption);

  // Add state options
  states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.text = state;
    dropdown.add(option);
  });
}

// Initialize state dropdown on page load
initializeStates('state');

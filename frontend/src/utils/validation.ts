export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  const requirements = [
    { regex: /.{8,}/, message: "be at least 8 characters long" },
    { regex: /[A-Z]/, message: "contain at least one uppercase letter" },
    { regex: /[a-z]/, message: "contain at least one lowercase letter" },
    { regex: /[0-9]/, message: "contain at least one number" },
    { regex: /[@$!%*?&#]/, message: "contain at least one special character (@$!%*?&#)" }
  ];

  const failedRequirements = requirements.filter(req => !req.regex.test(password));

  if (failedRequirements.length === 0) {
    return { isValid: true, message: "Password meets all requirements" };
  }

  const message = `Password must ${failedRequirements.map(r => r.message).join(", ")}`;
  return { isValid: false, message };
};

export const validatePhone = (phone: string): { isValid: boolean; message: string } => {
  // Remove any non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return {
      isValid: false,
      message: "Phone number is required"
    };
  }
  
  if (cleanPhone.length !== 8) {
    return {
      isValid: false,
      message: cleanPhone.length < 8 
        ? `Phone number must be 8 digits (${8 - cleanPhone.length} more needed)`
        : "Phone number must be exactly 8 digits"
    };
  }
  
  // Check if it's a valid Tunisian mobile number (starts with 2, 3, 4, 5, 9)
  const validPrefixes = ['2', '3', '4', '5', '9'];
  if (!validPrefixes.includes(cleanPhone[0])) {
    return {
      isValid: false,
      message: "Phone number must start with 2, 3, 4, 5, or 9"
    };
  }
  
  return {
    isValid: true,
    message: "Valid phone number"
  };
};

// Helper function to format phone number as user types
export const formatPhoneNumber = (value: string): string => {
  // Remove any non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Format as: XX XXX XXX
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 8)}`;
  }
}; 
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
export const authSuccessMessages = {
  signup: (email) =>
    `A verification link has been sent to ${email}. Please use it in order to verify your account.`,
  resend: (email) =>
    `A new verification link has been sent to ${email}. Please use it in order to verify your account.`,
  verify: `Your account has been verified!`,
  login: `You have logged in successfully!`,
  logout: `You have logged out successfully!`,
  forgot_pass: (email) =>
    `A link has been sent to ${email}, which you can use in order to reset your password.`,
  reset_pass: `Resetting your password was successful. You will soon be redirected to the login page.`,
};

export const authErrorMessages = {
  user_not_found: "No user was found based on the provided credentials.",
  user_already_verified: "You",
  user_not_verified:
    "Your account is not verified so you cannot perform this action.",
  token_not_received: "No token could be found, please try again later.",
  token_blacklisted: "Token is no longer available.",
  token_expired: "Token is expired.",
  pass_dont_match: "Passwords do not match. Please try another password",
  generic_error: "Something went wrong. Please try again later.",
  pass_changed:
    "You have changed your password. Please login again to gain access.",
};

export const authValidationErrorMessages = {
  username: "Username is a required field.",
  email: "Email is a required field.",
  password: "Password is a required field.",
  username_length: "Username must be at least 6 characters long.",
  email_valid: "Email must be of a valid format.",
  password_length: "Password must be at least 8 characters long.",
  credential: "This operation requires a valid credential.",
};

export const authUniquenessErrorMessages = {
  username: "This username is already in use. Please try another one.",
  email: "This email is already in use. Please try another one.",
};

// user not found err
// user not verified err
// generic something went wrong
// no token err
// passwords dont match err

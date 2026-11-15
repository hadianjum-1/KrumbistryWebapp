// Test Feedback API & Email Dispatcher
import { feedbackSchema } from "../src/lib/validations";
import { sendFeedbackEmails } from "../src/lib/email";

async function runTests() {
  console.log("=== 1. Testing Zod Validation Schema ===");

  // Test 1: Valid Full Data
  const validData = {
    overallExperience: "Excellent",
    foodQuality: "Very Good",
    serviceExperience: "Excellent",
    fullName: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    comments: "The molten chocolate cake was divine and beautifully packaged!",
  };
  const parseValid = feedbackSchema.safeParse(validData);
  console.log("Test 1 (Valid full payload):", parseValid.success ? "PASS" : "FAIL");

  // Test 2: Valid without optional comments
  const validNoComments = {
    overallExperience: "Good",
    foodQuality: "Good",
    serviceExperience: "Good",
    fullName: "Bilal Ahmed",
    email: "bilal@example.com",
  };
  const parseNoComments = feedbackSchema.safeParse(validNoComments);
  console.log("Test 2 (Valid without comments):", parseNoComments.success ? "PASS" : "FAIL");

  // Test 3: Missing required question
  const missingQuestion = {
    overallExperience: "Excellent",
    // foodQuality missing
    serviceExperience: "Good",
    fullName: "Test User",
    email: "test@example.com",
  };
  const parseMissingQ = feedbackSchema.safeParse(missingQuestion);
  console.log("Test 3 (Missing foodQuality question fails):", !parseMissingQ.success ? "PASS" : "FAIL");

  // Test 4: Invalid email
  const invalidEmail = {
    overallExperience: "Excellent",
    foodQuality: "Excellent",
    serviceExperience: "Excellent",
    fullName: "Test User",
    email: "not-an-email",
  };
  const parseInvalidEmail = feedbackSchema.safeParse(invalidEmail);
  console.log("Test 4 (Invalid email format fails):", !parseInvalidEmail.success ? "PASS" : "FAIL");

  // Test 5: Missing name
  const missingName = {
    overallExperience: "Excellent",
    foodQuality: "Excellent",
    serviceExperience: "Excellent",
    fullName: " ",
    email: "test@example.com",
  };
  const parseMissingName = feedbackSchema.safeParse(missingName);
  console.log("Test 5 (Blank name fails):", !parseMissingName.success ? "PASS" : "FAIL");

  // Test 6: Comments over 1000 characters
  const longComments = {
    overallExperience: "Excellent",
    foodQuality: "Excellent",
    serviceExperience: "Excellent",
    fullName: "Test User",
    email: "test@example.com",
    comments: "x".repeat(1005),
  };
  const parseLongComments = feedbackSchema.safeParse(longComments);
  console.log("Test 6 (Comments > 1000 chars fails):", !parseLongComments.success ? "PASS" : "FAIL");

  console.log("\n=== 2. Testing Email Dispatcher ===");
  try {
    const result = await sendFeedbackEmails({
      fullName: "Zainab Malik",
      email: "zainab.malik@example.com",
      overallExperience: "Excellent",
      foodQuality: "Very Good",
      serviceExperience: "Excellent",
      comments: "Exceptional croissant lamination! Warmest compliments to the pastry chef.",
    });
    console.log("Email Dispatch Result:", result);
    console.log("Email Dispatcher: PASS");
  } catch (err) {
    console.error("Email Dispatcher FAIL:", err);
  }

  console.log("\n=== ALL FEEDBACK TESTS COMPLETED ===");
}

runTests();

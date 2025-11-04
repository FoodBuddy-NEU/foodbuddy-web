import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/signupPage";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/firebaseClient", () => ({ auth: {} }));

// Define FirebaseError inside the mock factory and export it
jest.mock("firebase/app", () => {
  class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = "FirebaseError";
      this.code = code;
    }
  }
  return { FirebaseError };
});

// Define auth function inside the mock factory and export it
jest.mock("firebase/auth", () => {
  const createUserWithEmailAndPassword = jest.fn();
  return { createUserWithEmailAndPassword };
});

// Import mocked exports to control behavior
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";

// Create typed local mock handle
const mockSignup = createUserWithEmailAndPassword as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test("signs up with email/password and redirects to home", async () => {
  mockSignup.mockResolvedValue({ user: { uid: "newuid" } });

  render(<SignupPage />);

  fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "new@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "newsecret" } });

  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Object), "new@example.com", "newsecret");
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
});

test("shows error message on signup failure", async () => {
  mockSignup.mockRejectedValue(new FirebaseError("auth/email-already-in-use", "Email already exists"));

  render(<SignupPage />);

  fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "dup@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret" } });

  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();
});
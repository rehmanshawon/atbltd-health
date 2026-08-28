import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MembershipModal from "../MembershipModal";

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    article: ({ children, ...props }: any) => (
      <article {...props}>{children}</article>
    ),
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  BadgeCheck: () => <span data-testid="icon-badge-check" />,
  BanknoteArrowUp: () => <span data-testid="icon-banknote" />,
  Check: () => <span data-testid="icon-check" />,
  CheckCircle2: () => <span data-testid="icon-check-circle" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  Copy: () => <span data-testid="icon-copy" />,
  CreditCard: () => <span data-testid="icon-credit-card" />,
  LockKeyhole: () => <span data-testid="icon-lock" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
  Smartphone: () => <span data-testid="icon-smartphone" />,
  X: () => <span data-testid="icon-x" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Clock: () => <span data-testid="icon-clock" />,
  Gift: () => <span data-testid="icon-gift" />,
  Text: () => <span data-testid="icon-text" />,
}));

const mockStrings = {
  title: "ATB Ltd Membership Form",
  details: "Your Details",
  payment: "Payment",
  verify: "Verify",
  detailsIntro: "Enter your information",
  fullName: "Full Name",
  mobileNumber: "Mobile Number",
  emailAddress: "Email",
  optional: "(optional)",
  required: "(required)",
  nid: "National ID Number",
  permanentAddress: "Permanent Address",
  currentAddress: "Current Address",
  referralId: "Referral ID",
  agreementText: "I agree to terms",
  continuePayment: "Continue to Payment",
  firstYearMembership: "First Year Membership",
  renewal: "Renewal 850 BDT/year",
  choosePayment: "Choose payment method",
  sendMoney: "Send Money",
  sendMoneyDetail: "Send 1,000 BDT to ATB bKash",
  merchant: "Merchant coming soon",
  safety: "Only send to official number",
  back: "Back",
  sentPayment: "I have sent payment",
  verifyMobile: "Verify Mobile",
  otpIntro: "Enter OTP sent to",
  yourMobileNumber: "your mobile",
  previewNotice: "Preview notice",
  otp: "OTP",
  enterOtp: "Enter OTP",
  verifyActivate: "Verify & Activate",
  membershipPreview: "Membership Preview",
  welcome: "Welcome",
  member: "member",
  cardNote: "Card note",
  membershipId: "Membership ID",
  tempPassword: "Temporary Password",
  benefitsAvailable: "Benefits available in one month",
  done: "Thank You",
  previewCode: "123456",
  transactionId: "Transaction ID",
  paymentMethod: "Sender Account",
  processingPayment: "Processing...",
  sendingOtp: "Sending OTP...",
  verifyingOtp: "Verifying...",
  errorOccurred: "An error occurred",
  tryAgain: "Dismiss",
  applicationReceived: "Application Received!",
  applicationReceivedDesc: "Your application has been submitted.",
  pendingVerificationNote: "Payment verification in progress.",
  whatHappensNext: "SMS will be sent after verification.",
  benefits: "Get 12,000 BDT benefits",
};

describe("MembershipModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: "Registration successful",
            memberId: "ATB-26-ME-06",
          }),
      }),
    ) as jest.Mock;
  });

  it("should render the modal when isOpen is true", () => {
    render(
      <MembershipModal
        isOpen={true}
        onClose={mockOnClose}
        strings={mockStrings as any}
      />,
    );

    expect(screen.getByText("ATB Ltd Membership Form")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mobile Number/)).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <MembershipModal
        isOpen={false}
        onClose={mockOnClose}
        strings={mockStrings as any}
      />,
    );

    expect(
      screen.queryByText("ATB Ltd Membership Form"),
    ).not.toBeInTheDocument();
  });

  it("should submit form with correct payload", async () => {
    const user = userEvent.setup();

    render(
      <MembershipModal
        isOpen={true}
        onClose={mockOnClose}
        strings={mockStrings as any}
      />,
    );

    // Fill form
    await user.type(screen.getByLabelText(/Full Name/), "Test Member");
    await user.type(screen.getByLabelText(/Mobile Number/), "01712345678");
    await user.type(screen.getByLabelText(/National ID/), "1234567890");
    await user.type(screen.getByLabelText(/Permanent Address/), "Test Address");
    await user.type(screen.getByLabelText(/Current Address/), "Test Address");
    await user.type(screen.getByLabelText(/Sender Account/), "01712345678");

    // Check agreement checkbox
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    // Submit
    await user.click(
      screen.getByRole("button", { name: /Continue to Payment/i }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Test Member"),
        }),
      );
    });

    // Should show success screen
    await waitFor(() => {
      expect(screen.getByText(/Application Received/)).toBeInTheDocument();
    });
  });

  it("should show error when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            message: "A member with this mobile number already exists",
          }),
      }),
    ) as jest.Mock;

    const user = userEvent.setup();

    render(
      <MembershipModal
        isOpen={true}
        onClose={mockOnClose}
        strings={mockStrings as any}
      />,
    );

    await user.type(screen.getByLabelText(/Full Name/), "Test Member");
    await user.type(screen.getByLabelText(/Mobile Number/), "01712345678");
    await user.type(screen.getByLabelText(/National ID/), "1234567890");
    await user.type(screen.getByLabelText(/Permanent Address/), "Test Address");
    await user.type(screen.getByLabelText(/Current Address/), "Test Address");
    await user.type(screen.getByLabelText(/Sender Account/), "01712345678");

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    await user.click(
      screen.getByRole("button", { name: /Continue to Payment/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/A member with this mobile number already exists/),
      ).toBeInTheDocument();
    });
  });

  it("should call onClose when close button clicked", async () => {
    render(
      <MembershipModal
        isOpen={true}
        onClose={mockOnClose}
        strings={mockStrings as any}
      />,
    );

    const closeButton = screen.getByRole("button", { name: /Close/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

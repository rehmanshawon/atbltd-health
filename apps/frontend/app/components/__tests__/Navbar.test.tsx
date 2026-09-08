import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

const mockStrings = {
  about: 'About Us',
  howItWorks: 'How It Works',
  benefits: 'ATB Ltd Services',
  contact: 'Contact',
  becomeMember: 'Become a Member',
  learnHowItWorks: 'Learn How It Works',
  scroll: 'Scroll',
  languageToggle: 'EN',
  login: 'Login',
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation links', () => {
    render(
      <Navbar
        onJoin={jest.fn()}
        strings={mockStrings}
        language="en"
        onLanguageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('ATB Ltd Services')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders Become a Member button', () => {
    render(
      <Navbar
        onJoin={jest.fn()}
        strings={mockStrings}
        language="en"
        onLanguageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Become a Member')).toBeInTheDocument();
  });

  it('renders Login link', () => {
    render(
      <Navbar
        onJoin={jest.fn()}
        strings={mockStrings}
        language="en"
        onLanguageChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('calls onJoin when Become a Member clicked', async () => {
    const onJoin = jest.fn();

    render(
      <Navbar onJoin={onJoin} strings={mockStrings} language="en" onLanguageChange={jest.fn()} />,
    );

    const memberButton = screen.getAllByText('Become a Member')[0];
    await userEvent.click(memberButton);

    expect(onJoin).toHaveBeenCalled();
  });

  it('calls onLanguageChange when language toggle clicked', async () => {
    const onLanguageChange = jest.fn();

    render(
      <Navbar
        onJoin={jest.fn()}
        strings={mockStrings}
        language="en"
        onLanguageChange={onLanguageChange}
      />,
    );

    const langButton = screen.getByText('EN');
    await userEvent.click(langButton);

    expect(onLanguageChange).toHaveBeenCalled();
  });
});

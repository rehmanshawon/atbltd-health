import { render, screen } from '@testing-library/react';
import AdminTable from '../AdminTable';

describe('AdminTable', () => {
  it('wraps the table in a horizontal scroll container with the default minimum width', () => {
    const { container } = render(
      <AdminTable aria-label="Members">
        <tbody>
          <tr>
            <td>Member</td>
          </tr>
        </tbody>
      </AdminTable>,
    );

    const table = screen.getByRole('table', { name: 'Members' });

    expect(container.firstChild).toHaveClass('overflow-x-auto');
    expect(table).toHaveStyle({ minWidth: '760px' });
  });

  it('preserves caller-supplied table attributes and minimum width', () => {
    render(
      <AdminTable aria-label="Claims" className="compact" minWidth={900} data-testid="claims-table">
        <tbody>
          <tr>
            <td>Claim</td>
          </tr>
        </tbody>
      </AdminTable>,
    );

    const table = screen.getByTestId('claims-table');

    expect(table).toHaveClass('w-full', 'compact');
    expect(table).toHaveAttribute('aria-label', 'Claims');
    expect(table).toHaveStyle({ minWidth: '900px' });
  });
});
